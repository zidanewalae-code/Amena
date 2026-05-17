const { Payment, Order, Purchase, Donator } = require('../models');

function canSeePayment(user, payment) {
  if (user.role === 'admin') {
    return true;
  }

  return Number(payment?.order?.purchase?.donor_id) === Number(user.user_id);
}

async function getAllPayments(req, res) {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'donator') {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const payments = await Payment.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          include: [{ model: Purchase, as: 'purchase', include: [{ model: Donator, as: 'donator' }] }]
        }
      ],
      order: [['payment_id', 'DESC']]
    });

    if (req.user.role === 'admin') {
      return res.status(200).json(payments);
    }

    const ownPayments = payments.filter((payment) => canSeePayment(req.user, payment));
    return res.status(200).json(ownPayments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
  }
}

async function getPaymentById(req, res) {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [{ model: Purchase, as: 'purchase', include: [{ model: Donator, as: 'donator' }] }]
        }
      ]
    });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (!canSeePayment(req.user, payment)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch payment', error: error.message });
  }
}

async function createPayment(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const { amount, payment_method, payment_status, order_id } = req.body;
    if (!amount || !order_id) {
      return res.status(400).json({ message: 'amount and order_id are required' });
    }

    const existing = await Payment.findOne({ where: { order_id } });
    if (existing) {
      return res.status(409).json({ message: 'Payment already exists for this order' });
    }

    return res.status(201).json(
      await Payment.create({ amount, payment_method, payment_status: payment_status || 'pending', order_id })
    );
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create payment', error: error.message });
  }
}

async function updatePayment(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const { amount, payment_method, payment_status, order_id } = req.body;
    if (amount !== undefined) payment.amount = amount;
    if (payment_method !== undefined) payment.payment_method = payment_method;
    if (payment_status !== undefined) payment.payment_status = payment_status;
    if (order_id !== undefined) payment.order_id = order_id;

    await payment.save();
    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update payment', error: error.message });
  }
}

async function deletePayment(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await payment.destroy();
    return res.status(200).json({ message: 'Payment deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete payment', error: error.message });
  }
}

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
};