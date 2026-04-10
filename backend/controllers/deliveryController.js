// Handles mission creation, assignment, tracking, proof capture, and timeline events.
const {
  DeliveryMission,
  DeliveryEvent,
  DeliveryProof,
  DeliveryRequest,
  DeliveryOffer,
  CourierProfile,
  User,
  Need,
  DonationOrder
} = require('../models');
const { Op } = require('sequelize');
const {
  emitDeliveryRequestCreated,
  emitDeliveryOfferUpdate,
  emitDeliveryRequestUpdate
} = require('../services/deliveryRealtimeService');

const allowedStatuses = ['to_assign', 'assigned', 'in_progress', 'delivered', 'failed', 'disputed', 'canceled'];
const requestStatuses = ['pending', 'accepted', 'in_progress', 'delivered', 'confirmed', 'canceled', 'expired'];

const requestTransitions = {
  pending: ['accepted', 'canceled', 'expired'],
  accepted: ['in_progress', 'canceled'],
  in_progress: ['delivered', 'canceled'],
  delivered: ['confirmed'],
  confirmed: [],
  canceled: ['pending'],
  expired: ['pending']
};

function getRequestTimeoutMinutes() {
  return Number(process.env.DELIVERY_REQUEST_TIMEOUT_MIN || 5);
}

function getExpirationDate() {
  return new Date(Date.now() + getRequestTimeoutMinutes() * 60 * 1000);
}

async function markExpiredIfNeeded(deliveryRequest) {
  if (!deliveryRequest || deliveryRequest.status !== 'pending') return deliveryRequest;
  if (new Date(deliveryRequest.expires_at) > new Date()) return deliveryRequest;

  deliveryRequest.status = 'expired';
  await deliveryRequest.save();
  return deliveryRequest;
}

function canManageRequest(user, deliveryRequest) {
  return user.role === 'admin' || Number(deliveryRequest.requested_by_user_id) === Number(user.id);
}

async function createDeliveryRequest(req, res) {
  try {
    const {
      need_id,
      donation_order_id,
      pickup_location,
      dropoff_location,
      proposed_price
    } = req.body;

    if (need_id) {
      const need = await Need.findByPk(need_id);
      if (!need) {
        return res.status(404).json({ message: 'Need not found' });
      }
    }

    if (donation_order_id) {
      const order = await DonationOrder.findByPk(donation_order_id);
      if (!order) {
        return res.status(404).json({ message: 'Donation order not found' });
      }
    }

    const deliveryRequest = await DeliveryRequest.create({
      need_id: need_id || null,
      donation_order_id: donation_order_id || null,
      requested_by_user_id: req.user.id,
      pickup_location,
      dropoff_location,
      proposed_price,
      status: 'pending',
      expires_at: getExpirationDate()
    });

    const nearbyCourierIds = emitDeliveryRequestCreated(deliveryRequest.toJSON());

    return res.status(201).json({
      message: 'Delivery request created and broadcast to nearby couriers',
      request: deliveryRequest,
      broadcasted_couriers: nearbyCourierIds.length
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create delivery request', error: error.message });
  }
}

async function listDeliveryRequests(req, res) {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    if (req.user.role === 'organization') {
      where.requested_by_user_id = req.user.id;
    }

    if (req.user.role === 'courier') {
      where[Op.or] = [{ status: 'pending' }, { assigned_courier_id: req.user.id }];
    }

    const requests = await DeliveryRequest.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'requester', attributes: ['id', 'full_name', 'phone'] },
        { model: User, as: 'assignedCourier', attributes: ['id', 'full_name', 'phone'] }
      ]
    });

    await Promise.all(requests.map(markExpiredIfNeeded));

    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list delivery requests', error: error.message });
  }
}

async function submitDeliveryOffer(req, res) {
  try {
    if (req.user.role !== 'courier') {
      return res.status(403).json({ message: 'Only couriers can submit offers' });
    }

    const deliveryRequest = await DeliveryRequest.findByPk(req.params.id);
    if (!deliveryRequest) {
      return res.status(404).json({ message: 'Delivery request not found' });
    }

    await markExpiredIfNeeded(deliveryRequest);

    if (deliveryRequest.status !== 'pending') {
      return res.status(409).json({ message: `Request is ${deliveryRequest.status} and no longer negotiable` });
    }

    const offeredPrice = req.body.offered_price || deliveryRequest.proposed_price;

    let offer = await DeliveryOffer.findOne({
      where: {
        request_id: deliveryRequest.id,
        courier_user_id: req.user.id
      }
    });

    if (!offer) {
      offer = await DeliveryOffer.create({
        request_id: deliveryRequest.id,
        courier_user_id: req.user.id,
        offered_price: offeredPrice,
        note: req.body.note || null,
        status: 'pending'
      });
    } else {
      offer.offered_price = offeredPrice;
      offer.note = req.body.note || offer.note;
      offer.status = 'pending';
      await offer.save();
    }

    emitDeliveryOfferUpdate(deliveryRequest.requested_by_user_id, {
      request_id: deliveryRequest.id,
      offer
    });

    return res.status(200).json({ message: 'Offer submitted', offer });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit delivery offer', error: error.message });
  }
}

async function listDeliveryOffers(req, res) {
  try {
    const deliveryRequest = await DeliveryRequest.findByPk(req.params.id);
    if (!deliveryRequest) {
      return res.status(404).json({ message: 'Delivery request not found' });
    }

    if (req.user.role === 'courier') {
      const ownOffers = await DeliveryOffer.findAll({
        where: { request_id: deliveryRequest.id, courier_user_id: req.user.id },
        order: [['created_at', 'ASC']]
      });
      return res.status(200).json(ownOffers);
    }

    if (!canManageRequest(req.user, deliveryRequest)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const offers = await DeliveryOffer.findAll({
      where: { request_id: deliveryRequest.id },
      include: [{ model: User, as: 'courier', attributes: ['id', 'full_name', 'phone'] }],
      order: [['offered_price', 'ASC'], ['created_at', 'ASC']]
    });

    return res.status(200).json(offers);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list offers', error: error.message });
  }
}

async function selectDeliveryOffer(req, res) {
  const transaction = await DeliveryRequest.sequelize.transaction();

  try {
    const deliveryRequest = await DeliveryRequest.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!deliveryRequest) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Delivery request not found' });
    }

    if (!canManageRequest(req.user, deliveryRequest)) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (deliveryRequest.status !== 'pending') {
      await transaction.rollback();
      return res.status(409).json({ message: `Request already ${deliveryRequest.status}` });
    }

    const selectedOffer = await DeliveryOffer.findOne({
      where: {
        id: req.body.offer_id,
        request_id: deliveryRequest.id,
        status: 'pending'
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!selectedOffer) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Pending offer not found' });
    }

    const competingOffers = await DeliveryOffer.findAll({
      where: {
        request_id: deliveryRequest.id,
        status: 'pending',
        id: { [Op.ne]: selectedOffer.id }
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    deliveryRequest.status = 'accepted';
    deliveryRequest.assigned_courier_id = selectedOffer.courier_user_id;
    deliveryRequest.selected_offer_id = selectedOffer.id;
    deliveryRequest.accepted_price = selectedOffer.offered_price;
    deliveryRequest.accepted_at = new Date();
    await deliveryRequest.save({ transaction });

    selectedOffer.status = 'accepted';
    await selectedOffer.save({ transaction });

    await DeliveryOffer.update(
      { status: 'rejected' },
      {
        where: {
          request_id: deliveryRequest.id,
          status: 'pending',
          id: { [Op.ne]: selectedOffer.id }
        },
        transaction
      }
    );

    await transaction.commit();

    emitDeliveryRequestUpdate([deliveryRequest.requested_by_user_id, selectedOffer.courier_user_id], {
      type: 'offer_selected',
      request_id: deliveryRequest.id,
      offer_id: selectedOffer.id,
      status: deliveryRequest.status
    });

    emitDeliveryRequestUpdate(
      competingOffers.map((offer) => Number(offer.courier_user_id)),
      {
        type: 'offer_rejected',
        request_id: deliveryRequest.id,
        status: 'rejected'
      }
    );

    return res.status(200).json({ message: 'Offer selected', request: deliveryRequest, selected_offer: selectedOffer });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: 'Failed to select offer', error: error.message });
  }
}

async function updateDeliveryRequestStatus(req, res) {
  try {
    const { status } = req.body;
    if (!requestStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid request status' });
    }

    const deliveryRequest = await DeliveryRequest.findByPk(req.params.id);
    if (!deliveryRequest) {
      return res.status(404).json({ message: 'Delivery request not found' });
    }

    if (!requestTransitions[deliveryRequest.status].includes(status)) {
      return res.status(409).json({ message: `Transition ${deliveryRequest.status} -> ${status} is not allowed` });
    }

    const isAdmin = req.user.role === 'admin';
    const isRequester = Number(deliveryRequest.requested_by_user_id) === Number(req.user.id);
    const isAssignedCourier = Number(deliveryRequest.assigned_courier_id) === Number(req.user.id);

    if (status === 'in_progress' || status === 'delivered') {
      if (!isAssignedCourier && !isAdmin) {
        return res.status(403).json({ message: 'Only selected courier or admin can set this status' });
      }
    }

    if (status === 'confirmed') {
      if (!isRequester && !isAdmin) {
        return res.status(403).json({ message: 'Only requester or admin can confirm delivery' });
      }
    }

    if (status === 'canceled') {
      if (!isRequester && !isAssignedCourier && !isAdmin) {
        return res.status(403).json({ message: 'Forbidden to cancel this request' });
      }
    }

    deliveryRequest.status = status;
    if (status === 'delivered') {
      deliveryRequest.delivered_at = new Date();
    }
    if (status === 'confirmed') {
      deliveryRequest.confirmed_at = new Date();
    }
    await deliveryRequest.save();

    const notifyUsers = [deliveryRequest.requested_by_user_id];
    if (deliveryRequest.assigned_courier_id) {
      notifyUsers.push(deliveryRequest.assigned_courier_id);
    }

    emitDeliveryRequestUpdate(notifyUsers, {
      type: 'status_changed',
      request_id: deliveryRequest.id,
      status: deliveryRequest.status
    });

    return res.status(200).json({ message: 'Delivery request status updated', request: deliveryRequest });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update delivery request status', error: error.message });
  }
}

async function reassignDeliveryRequest(req, res) {
  try {
    const deliveryRequest = await DeliveryRequest.findByPk(req.params.id);
    if (!deliveryRequest) {
      return res.status(404).json({ message: 'Delivery request not found' });
    }

    if (!canManageRequest(req.user, deliveryRequest)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!['canceled', 'expired', 'accepted'].includes(deliveryRequest.status)) {
      return res.status(409).json({ message: `Cannot reassign request in status ${deliveryRequest.status}` });
    }

    const previousCourierId = deliveryRequest.assigned_courier_id;

    deliveryRequest.status = 'pending';
    deliveryRequest.assigned_courier_id = null;
    deliveryRequest.selected_offer_id = null;
    deliveryRequest.accepted_price = null;
    deliveryRequest.accepted_at = null;
    deliveryRequest.expires_at = getExpirationDate();
    await deliveryRequest.save();

    await DeliveryOffer.update(
      { status: 'rejected' },
      {
        where: {
          request_id: deliveryRequest.id,
          status: { [Op.in]: ['pending', 'accepted'] }
        }
      }
    );

    const nearbyCourierIds = emitDeliveryRequestCreated(deliveryRequest.toJSON());

    if (previousCourierId) {
      emitDeliveryRequestUpdate([previousCourierId], {
        type: 'request_reassigned',
        request_id: deliveryRequest.id
      });
    }

    return res.status(200).json({
      message: 'Request moved back to pending and rebroadcast',
      request: deliveryRequest,
      broadcasted_couriers: nearbyCourierIds.length
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reassign request', error: error.message });
  }
}

async function expirePendingRequests(req, res) {
  try {
    const expiredRequests = await DeliveryRequest.findAll({
      where: {
        status: 'pending',
        expires_at: { [Op.lt]: new Date() }
      }
    });

    await Promise.all(
      expiredRequests.map(async (deliveryRequest) => {
        deliveryRequest.status = 'expired';
        await deliveryRequest.save();
        emitDeliveryRequestUpdate([deliveryRequest.requested_by_user_id], {
          type: 'request_expired',
          request_id: deliveryRequest.id,
          status: 'expired'
        });
      })
    );

    return res.status(200).json({ expired_count: expiredRequests.length });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to expire pending requests', error: error.message });
  }
}

async function listMissions(req, res) {
  try {
    const where = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.courier_user_id) where.courier_user_id = req.query.courier_user_id;

    if (req.user.role === 'courier') {
      where.courier_user_id = req.user.id;
    }

    const missions = await DeliveryMission.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: Need, as: 'need', attributes: ['id', 'title', 'status'] },
        { model: User, as: 'courier', attributes: ['id', 'full_name', 'phone'] },
        { model: DeliveryEvent, as: 'events' },
        { model: DeliveryProof, as: 'proofs' }
      ]
    });

    return res.status(200).json(missions);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list missions', error: error.message });
  }
}

async function createMission(req, res) {
  try {
    const { need_id, donation_order_id, pickup_address, dropoff_address, scheduled_at } = req.body;

    const need = await Need.findByPk(need_id);
    if (!need) {
      return res.status(404).json({ message: 'Need not found' });
    }

    if (donation_order_id) {
      const order = await DonationOrder.findByPk(donation_order_id);
      if (!order) {
        return res.status(404).json({ message: 'Donation order not found' });
      }
    }

    const mission = await DeliveryMission.create({
      need_id,
      donation_order_id: donation_order_id || null,
      pickup_address,
      dropoff_address,
      scheduled_at,
      status: 'to_assign',
      created_by_user_id: req.user.id
    });

    await DeliveryEvent.create({
      mission_id: mission.id,
      event_type: 'created',
      event_note: 'Mission created',
      actor_user_id: req.user.id
    });

    return res.status(201).json({ message: 'Mission created', mission, notification: 'Mission en attente d\'assignation.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create mission', error: error.message });
  }
}

async function assignMission(req, res) {
  try {
    const { courier_user_id } = req.body;

    const mission = await DeliveryMission.findByPk(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    const courier = await User.findByPk(courier_user_id);
    if (!courier || courier.role !== 'courier') {
      return res.status(400).json({ message: 'Invalid courier user' });
    }

    mission.courier_user_id = courier_user_id;
    mission.status = 'assigned';
    await mission.save();

    let courierProfile = await CourierProfile.findOne({ where: { user_id: courier_user_id } });
    if (!courierProfile) {
      courierProfile = await CourierProfile.create({ user_id: courier_user_id, trust_score: 50 });
    }

    await DeliveryEvent.create({
      mission_id: mission.id,
      event_type: 'assigned',
      event_note: `Mission assigned to courier ${courier_user_id}`,
      actor_user_id: req.user.id
    });

    return res.status(200).json({ message: 'Mission assigned', mission, notification: 'Courier assigne a la mission.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to assign mission', error: error.message });
  }
}

async function updateMissionStatus(req, res) {
  try {
    const { status, event_note } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid mission status' });
    }

    const mission = await DeliveryMission.findByPk(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    const isAssignedCourier = mission.courier_user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAssignedCourier && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: only assigned courier or admin can update status' });
    }

    mission.status = status;
    if (status === 'in_progress' && !mission.started_at) {
      mission.started_at = new Date();
    }
    if (status === 'delivered') {
      mission.delivered_at = new Date();
    }

    await mission.save();

    const eventTypeMap = {
      assigned: 'assigned',
      in_progress: 'en_route',
      delivered: 'delivered',
      failed: 'failed',
      disputed: 'disputed',
      canceled: 'canceled',
      to_assign: 'created'
    };

    await DeliveryEvent.create({
      mission_id: mission.id,
      event_type: eventTypeMap[status],
      event_note: event_note || `Mission status changed to ${status}`,
      actor_user_id: req.user.id
    });

    if (status === 'delivered' || status === 'failed') {
      const courierProfile = await CourierProfile.findOne({ where: { user_id: mission.courier_user_id } });
      if (courierProfile) {
        courierProfile.total_missions += 1;
        if (status === 'delivered') {
          courierProfile.successful_missions += 1;
        }
        await courierProfile.save();
      }
    }

    return res.status(200).json({ message: 'Mission status updated', mission, notification: `Mission ${status}` });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update mission status', error: error.message });
  }
}

async function addMissionProof(req, res) {
  try {
    const mission = await DeliveryMission.findByPk(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    const isAssignedCourier = mission.courier_user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAssignedCourier && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: only assigned courier or admin can add proof' });
    }

    const proof = await DeliveryProof.create({
      mission_id: mission.id,
      photo_url: req.body.photo_url,
      signature_url: req.body.signature_url,
      otp_code: req.body.otp_code,
      gps_lat: req.body.gps_lat,
      gps_lng: req.body.gps_lng
    });

    await DeliveryEvent.create({
      mission_id: mission.id,
      event_type: 'arrived',
      event_note: 'Delivery proof uploaded',
      actor_user_id: req.user.id
    });

    return res.status(201).json({ message: 'Delivery proof added', proof, notification: 'Preuve de livraison recue.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add delivery proof', error: error.message });
  }
}

async function getMissionById(req, res) {
  try {
    const mission = await DeliveryMission.findByPk(req.params.id, {
      include: [
        { model: Need, as: 'need', attributes: ['id', 'title', 'status'] },
        { model: User, as: 'courier', attributes: ['id', 'full_name', 'phone'] },
        { model: DeliveryEvent, as: 'events' },
        { model: DeliveryProof, as: 'proofs' }
      ]
    });

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    return res.status(200).json(mission);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch mission', error: error.message });
  }
}

module.exports = {
  listMissions,
  createMission,
  assignMission,
  updateMissionStatus,
  addMissionProof,
  getMissionById,
  createDeliveryRequest,
  listDeliveryRequests,
  submitDeliveryOffer,
  listDeliveryOffers,
  selectDeliveryOffer,
  updateDeliveryRequestStatus,
  reassignDeliveryRequest,
  expirePendingRequests
};
