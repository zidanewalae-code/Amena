// Handles checkout, order history, and order detail retrieval.
const {
  DonationCart,
  DonationCartItem,
  DonationOrder,
  Donation,
  PaymentTransaction,
  Need
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { getProvider } = require('../services/payments/paymentProviderFactory');
const { normalizeCurrency, convertFromTnd } = require('../utils/currency');

function makeOrderRef() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function ensureDonorRole(req, res) {
  if (req.user.role !== 'donor' && req.user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden: donor role required' });
    return false;
  }
  return true;
}

async function checkout(req, res) {
  try {
    if (!ensureDonorRole(req, res)) return;

    const providerName = req.body.provider_name || process.env.PAYMENT_PROVIDER || 'mock';
    const selectedCurrency = normalizeCurrency(req.body.currency || 'TND');

    const cart = await DonationCart.findOne({
      where: { donor_user_id: req.user.id },
      include: [{ model: DonationCartItem, as: 'items' }]
    });

    if (!cart || !cart.items?.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const totalAmountTnd = cart.items.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalAmount = convertFromTnd(totalAmountTnd, selectedCurrency);
    const idempotencyKey = `checkout_${req.user.id}_${Date.now()}`;

    const order = await DonationOrder.create({
      donor_user_id: req.user.id,
      cart_id: cart.id,
      order_reference: makeOrderRef(),
      total_amount: totalAmount,
      currency: selectedCurrency,
      status: 'pending'
    });

    await Donation.bulkCreate(
      cart.items.map((item) => ({
        order_id: order.id,
        donor_user_id: req.user.id,
        need_id: item.need_id,
        amount: item.amount,
        status: 'pending'
      }))
    );

    const provider = getProvider(providerName);
    const intent = await provider.createPaymentIntent({
      amount: totalAmount,
      currency: selectedCurrency,
      metadata: {
        order_id: String(order.id),
        donor_user_id: String(req.user.id),
        amount_tnd: String(totalAmountTnd)
      },
      idempotencyKey
    });

    await PaymentTransaction.create({
      donation_order_id: order.id,
      provider_name: providerName,
      transaction_id: intent.providerTransactionId,
      idempotency_key: idempotencyKey,
      status: 'pending',
      amount: totalAmount,
      currency: selectedCurrency,
      raw_payload: intent.payload || { source: 'checkout', amount_tnd: totalAmountTnd }
    });

    await DonationCartItem.destroy({ where: { cart_id: cart.id } });
    cart.status = 'checked_out';
    await cart.save();

    logger.info('checkout.created', {
      orderId: order.id,
      donorUserId: req.user.id,
      provider: providerName,
      totalAmount,
      currency: selectedCurrency,
      totalAmountTnd
    });

    return res.status(201).json({
      message: 'Checkout created',
      order,
      payment: {
        provider: providerName,
        client_secret: intent.clientSecret || null,
        provider_transaction_id: intent.providerTransactionId
      }
    });
  } catch (error) {
    logger.error('checkout.failed', { donorUserId: req.user?.id, error: error.message });
    return res.status(500).json({ message: 'Checkout failed', error: error.message });
  }
}

async function getOrderHistory(req, res) {
  try {
    if (!ensureDonorRole(req, res)) return;

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;

    const orderWhere = { donor_user_id: req.user.id };
    if (req.query.status) orderWhere.status = req.query.status;
    if (req.query.currency) orderWhere.currency = normalizeCurrency(req.query.currency);

    if (req.query.start_date || req.query.end_date) {
      orderWhere.created_at = {};
      if (req.query.start_date) {
        orderWhere.created_at[Op.gte] = new Date(req.query.start_date);
      }
      if (req.query.end_date) {
        orderWhere.created_at[Op.lte] = new Date(req.query.end_date);
      }
    }

    if (req.query.min_amount || req.query.max_amount) {
      orderWhere.total_amount = {};
      if (req.query.min_amount) orderWhere.total_amount[Op.gte] = Number(req.query.min_amount);
      if (req.query.max_amount) orderWhere.total_amount[Op.lte] = Number(req.query.max_amount);
    }

    const txWhere = {};
    if (req.query.payment_status) txWhere.status = req.query.payment_status;
    if (req.query.provider) txWhere.provider_name = req.query.provider;
    const txWhereFinal = Object.keys(txWhere).length ? txWhere : undefined;

    const baseQuery = {
      where: orderWhere,
      attributes: ['id'],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    };

    if (txWhereFinal) {
      baseQuery.include = [
        {
          model: PaymentTransaction,
          as: 'transaction',
          where: txWhereFinal,
          required: true,
          attributes: []
        }
      ];
    }

    const { count, rows: idRows } = await DonationOrder.findAndCountAll(baseQuery);
    const orderIds = idRows.map((row) => row.id);

    const rows = orderIds.length
      ? await DonationOrder.findAll({
        where: { id: { [Op.in]: orderIds } },
        include: [
          {
            model: Donation,
            as: 'donations',
            include: [{ model: Need, as: 'need', attributes: ['id', 'title', 'category', 'status'] }]
          },
          {
            model: PaymentTransaction,
            as: 'transaction',
            where: txWhereFinal,
            required: Boolean(txWhereFinal)
          }
        ]
      })
      : [];

    const byId = new Map(rows.map((row) => [row.id, row]));
    const orderedRows = orderIds.map((id) => byId.get(id)).filter(Boolean);

    return res.status(200).json({
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
      filters: {
        status: req.query.status || null,
        payment_status: req.query.payment_status || null,
        currency: req.query.currency || null,
        provider: req.query.provider || null,
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        min_amount: req.query.min_amount || null,
        max_amount: req.query.max_amount || null
      },
      items: orderedRows
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch order history', error: error.message });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await DonationOrder.findByPk(req.params.id, {
      include: [
        {
          model: Donation,
          as: 'donations',
          include: [{ model: Need, as: 'need', attributes: ['id', 'title', 'category', 'status'] }]
        },
        { model: PaymentTransaction, as: 'transaction' }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isOwner = order.donor_user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: order access denied' });
    }

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
}

module.exports = {
  checkout,
  getOrderHistory,
  getOrderById
};
