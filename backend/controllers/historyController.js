const { History, Order, Don, DeliveryPerson, Purchase, Donator } = require('../models');

function canSeeHistory(user, history) {
  if (user.role === 'admin' || user.role === 'organization') {
    return true;
  }

  if (user.role === 'delivery_person') {
    return Number(history?.delivery_person_id) === Number(user.user_id);
  }

  if (user.role === 'donator') {
    const donorId = history?.donation?.donor_id || history?.order?.purchase?.donor_id;
    return Number(donorId) === Number(user.user_id);
  }

  return false;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function getAllHistory(req, res) {
  try {
    const history = await History.findAll({
      order: [['history_id', 'DESC']],
      include: [
        { model: Order, as: 'order', include: [{ model: Purchase, as: 'purchase', include: [{ model: Donator, as: 'donator' }] }] },
        { model: Don, as: 'donation', include: [{ model: Donator, as: 'donator' }] },
        { model: DeliveryPerson, as: 'deliveryPerson' }
      ]
    });

    if (req.user.role === 'admin' || req.user.role === 'organization') {
      return res.status(200).json(history);
    }

    return res.status(200).json(history.filter((item) => canSeeHistory(req.user, item)));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
}

async function getHistoryById(req, res) {
  try {
    const history = await History.findByPk(req.params.id, {
      include: [
        { model: Order, as: 'order', include: [{ model: Purchase, as: 'purchase', include: [{ model: Donator, as: 'donator' }] }] },
        { model: Don, as: 'donation', include: [{ model: Donator, as: 'donator' }] },
        { model: DeliveryPerson, as: 'deliveryPerson' }
      ]
    });

    if (!history) return res.status(404).json({ message: 'History not found' });
    if (!canSeeHistory(req.user, history)) return res.status(403).json({ message: 'Forbidden: role not allowed' });
    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch history entry', error: error.message });
  }
}

async function createHistory(req, res) {
  try {
    const { action, action_date, order_id, don_id, delivery_person_id } = req.body;
    return res.status(201).json(await History.create({ action, action_date: action_date || today(), order_id: order_id || null, don_id: don_id || null, delivery_person_id: delivery_person_id || null }));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create history entry', error: error.message });
  }
}

async function updateHistory(req, res) {
  try {
    const history = await History.findByPk(req.params.id);
    if (!history) return res.status(404).json({ message: 'History not found' });
    const { action, action_date, order_id, don_id, delivery_person_id } = req.body;
    if (action !== undefined) history.action = action;
    if (action_date !== undefined) history.action_date = action_date;
    if (order_id !== undefined) history.order_id = order_id;
    if (don_id !== undefined) history.don_id = don_id;
    if (delivery_person_id !== undefined) history.delivery_person_id = delivery_person_id;
    await history.save();
    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update history entry', error: error.message });
  }
}

async function deleteHistory(req, res) {
  try {
    const history = await History.findByPk(req.params.id);
    if (!history) return res.status(404).json({ message: 'History not found' });
    await history.destroy();
    return res.status(200).json({ message: 'History deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete history entry', error: error.message });
  }
}

module.exports = { getAllHistory, getHistoryById, createHistory, updateHistory, deleteHistory };