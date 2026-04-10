// Controller to assign donations/orders to beneficiaries for full traceability.
const { SocialAssignment, SocialDonation, SocialOrder, SocialBeneficiary, User } = require('../models');

async function createAssignment(req, res) {
  try {
    const { type, donation_id, order_id, beneficiary_id } = req.body;

    const beneficiary = await SocialBeneficiary.findByPk(beneficiary_id);
    if (!beneficiary) return res.status(404).json({ message: 'Beneficiary not found' });

    if (type === 'donation') {
      const donation = await SocialDonation.findByPk(donation_id);
      if (!donation) return res.status(404).json({ message: 'Donation not found' });
    } else if (type === 'order') {
      const order = await SocialOrder.findByPk(order_id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
    } else {
      return res.status(400).json({ message: 'type must be donation or order' });
    }

    const assignment = await SocialAssignment.create({ type, donation_id: donation_id || null, order_id: order_id || null, beneficiary_id });
    return res.status(201).json({ message: 'Assignment created', assignment });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create assignment', error: error.message });
  }
}

async function listAssignments(req, res) {
  try {
    const assignments = await SocialAssignment.findAll({
      order: [['created_at', 'DESC']],
      include: [
        { model: SocialBeneficiary, as: 'beneficiary' },
        { model: SocialDonation, as: 'donation', include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }] },
        { model: SocialOrder, as: 'order', include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }] }
      ]
    });
    return res.status(200).json(assignments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list assignments', error: error.message });
  }
}

async function listMyTraceability(req, res) {
  try {
    const assignments = await SocialAssignment.findAll({
      order: [['created_at', 'DESC']],
      include: [
        { model: SocialBeneficiary, as: 'beneficiary' },
        { model: SocialDonation, as: 'donation' },
        { model: SocialOrder, as: 'order' }
      ]
    });

    const mine = assignments.filter((entry) => {
      const donationOwner = entry.donation ? Number(entry.donation.user_id) === Number(req.user.id) : false;
      const orderOwner = entry.order ? Number(entry.order.user_id) === Number(req.user.id) : false;
      return donationOwner || orderOwner;
    });

    return res.status(200).json(mine);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch traceability', error: error.message });
  }
}

async function getAssignmentById(req, res) {
  try {
    const assignment = await SocialAssignment.findByPk(req.params.id, {
      include: [
        { model: SocialBeneficiary, as: 'beneficiary' },
        { model: SocialDonation, as: 'donation' },
        { model: SocialOrder, as: 'order' }
      ]
    });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    return res.status(200).json(assignment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch assignment', error: error.message });
  }
}

async function updateAssignment(req, res) {
  try {
    const assignment = await SocialAssignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const nextType = req.body.type || assignment.type;
    const nextDonationId = req.body.donation_id !== undefined ? req.body.donation_id : assignment.donation_id;
    const nextOrderId = req.body.order_id !== undefined ? req.body.order_id : assignment.order_id;
    const nextBeneficiaryId = req.body.beneficiary_id !== undefined ? req.body.beneficiary_id : assignment.beneficiary_id;

    if (nextType === 'donation' && !nextDonationId) {
      return res.status(400).json({ message: 'donation_id is required when type=donation' });
    }
    if (nextType === 'order' && !nextOrderId) {
      return res.status(400).json({ message: 'order_id is required when type=order' });
    }

    assignment.type = nextType;
    assignment.donation_id = nextType === 'donation' ? nextDonationId : null;
    assignment.order_id = nextType === 'order' ? nextOrderId : null;
    assignment.beneficiary_id = nextBeneficiaryId;
    await assignment.save();

    return res.status(200).json({ message: 'Assignment updated', assignment });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update assignment', error: error.message });
  }
}

async function deleteAssignment(req, res) {
  try {
    const assignment = await SocialAssignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    await assignment.destroy();
    return res.status(200).json({ message: 'Assignment deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete assignment', error: error.message });
  }
}

module.exports = {
  createAssignment,
  listAssignments,
  listMyTraceability,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
};
