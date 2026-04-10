// Handles secure payment callback/webhook flows with idempotence and rollback logic.
const sequelize = require('../config/db');
const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  PaymentTransaction,
  DonationOrder,
  Donation,
  Need,
  User,
  PaymentWebhookEvent
} = require('../models');
const { getProvider } = require('../services/payments/paymentProviderFactory');
const { canTransition } = require('../services/payments/paymentStateMachine');
const { sendPaymentSuccess, sendOperationalAlert } = require('../services/notifications/notificationService');
const { appendAuditEvent } = require('../services/payments/auditTrailService');
const logger = require('../utils/logger');

async function applyOrderAndDonationState({ order, transaction, nextStatus, providerTransactionId, payload, dbTx, traceId }) {
  if (!canTransition(transaction.status, nextStatus)) {
    throw new Error(`Invalid payment state transition ${transaction.status} -> ${nextStatus}`);
  }

  if (transaction.status === nextStatus) {
    logger.info('payment.transition.idempotent', {
      orderId: order.id,
      paymentTransactionId: transaction.id,
      status: nextStatus
    });
    return { shouldNotify: false };
  }

  const previousStatus = transaction.status;
  transaction.status = nextStatus;
  transaction.last_webhook_at = new Date();
  order.last_webhook_at = transaction.last_webhook_at;
  if (providerTransactionId) transaction.transaction_id = providerTransactionId;
  transaction.raw_payload = payload || transaction.raw_payload;
  let notifyPayload = { shouldNotify: false };

  const donations = await Donation.findAll({ where: { order_id: order.id }, transaction: dbTx });
  const needIds = [...new Set(donations.map((donation) => Number(donation.need_id)).filter(Boolean))];
  const needs = needIds.length
    ? await Need.findAll({ where: { id: { [Op.in]: needIds } }, transaction: dbTx })
    : [];
  const needById = new Map(needs.map((need) => [Number(need.id), need]));
  const failedNeedIds = new Set(
    Array.isArray(payload?.failed_need_ids) ? payload.failed_need_ids.map((v) => Number(v)) : []
  );

  if (nextStatus === 'paid') {
    let confirmedCount = 0;
    let failedCount = 0;
    order.status = 'paid';
    order.paid_at = new Date();

    for (const donation of donations) {
      if (donation.status !== 'pending') continue;

      if (failedNeedIds.has(Number(donation.need_id))) {
        donation.status = 'failed';
        failedCount += 1;
        await donation.save({ transaction: dbTx });
        continue;
      }

      donation.status = 'confirmed';
      confirmedCount += 1;
      await donation.save({ transaction: dbTx });

      const need = needById.get(Number(donation.need_id));
      if (!need) continue;
      need.amount_collected = Number(need.amount_collected) + Number(donation.amount);
      if (Number(need.amount_collected) >= Number(need.amount_target)) {
        need.status = 'funded';
      } else if (Number(need.amount_collected) > 0 && need.status !== 'closed') {
        need.status = 'partially_funded';
      }
      await need.save({ transaction: dbTx });
    }

    if (confirmedCount > 0 && failedCount > 0) {
      order.status = 'partially_paid';
      transaction.status = 'partially_paid';
    }

    if (confirmedCount === 0) {
      order.status = 'failed';
      transaction.status = 'failed';
    }

    notifyPayload = {
      shouldNotify: confirmedCount > 0,
      donorUserId: order.donor_user_id,
      orderSnapshot: {
        id: order.id,
        order_reference: order.order_reference,
        total_amount: order.total_amount,
        currency: order.currency,
        paid_at: order.paid_at
      },
      donationsSnapshot: donations.map((d) => ({ need_id: d.need_id, amount: d.amount }))
    };
  }

  if (nextStatus === 'failed') {
    order.status = 'failed';

    for (const donation of donations) {
      if (donation.status === 'pending') {
        donation.status = 'failed';
        await donation.save({ transaction: dbTx });
      }
    }
  }

  if (nextStatus === 'refunded') {
    order.status = 'refunded';

    for (const donation of donations) {
      if (donation.status !== 'confirmed') continue;
      donation.status = 'refunded';
      await donation.save({ transaction: dbTx });

      const need = needById.get(Number(donation.need_id));
      if (!need) continue;
      need.amount_collected = Math.max(Number(need.amount_collected) - Number(donation.amount), 0);
      if (Number(need.amount_collected) <= 0) {
        need.status = 'published';
      } else if (Number(need.amount_collected) < Number(need.amount_target) && need.status !== 'closed') {
        need.status = 'partially_funded';
      }
      await need.save({ transaction: dbTx });
    }
  }

  await appendAuditEvent({
    paymentTransactionId: transaction.id,
    donationOrderId: order.id,
    eventType: 'payment.transition',
    providerName: transaction.provider_name,
    statusBefore: previousStatus,
    statusAfter: transaction.status,
    traceId,
    payload,
    dbTx
  });

  await transaction.save({ transaction: dbTx });
  await order.save({ transaction: dbTx });

  return notifyPayload;
}

async function processPaymentEvent({ providerName, eventId, orderId, providerTransactionId, status, payload }) {
  let notificationPayload = null;
  const traceId = payload?.trace_id || eventId || crypto.randomUUID();

  const result = await sequelize.transaction(async (dbTx) => {
    if (eventId) {
      const [event, created] = await PaymentWebhookEvent.findOrCreate({
        where: { event_id: eventId },
        defaults: {
          provider_name: providerName,
          event_id: eventId,
          payload,
          processed_at: new Date()
        },
        transaction: dbTx
      });

      if (!created) {
        logger.info('payment.webhook.duplicate', { providerName, eventId });
        return { duplicate: true, event };
      }
    }

    const order = await DonationOrder.findByPk(orderId, { transaction: dbTx });
    if (!order) {
      throw new Error('Order not found');
    }

    let tx = await PaymentTransaction.findOne({ where: { donation_order_id: order.id }, transaction: dbTx });
    if (!tx) {
      tx = await PaymentTransaction.create({
        donation_order_id: order.id,
        provider_name: providerName,
        transaction_id: providerTransactionId || null,
        status: 'pending',
        amount: order.total_amount,
        currency: order.currency,
        raw_payload: payload
      }, { transaction: dbTx });
    }

    notificationPayload = await applyOrderAndDonationState({
      order,
      transaction: tx,
      nextStatus: status,
      providerTransactionId,
      payload,
      dbTx,
      traceId
    });

    logger.info('payment.event.processed', {
      providerName,
      eventId,
      orderId: order.id,
      status,
      trace_id: traceId
    });

    return { duplicate: false, order, transaction: tx };
  });

  if (notificationPayload?.shouldNotify) {
    const donor = await User.findByPk(notificationPayload.donorUserId);
    if (donor) {
      await sendPaymentSuccess({
        user: donor,
        order: notificationPayload.orderSnapshot,
        donations: notificationPayload.donationsSnapshot
      });
    }
  }

  if (!result.duplicate && status === 'failed') {
    await sendOperationalAlert({
      title: 'Alerte paiement echoue',
      body: `Paiement echoue pour order #${orderId} (${providerName}).`,
      context: {
        providerName,
        eventId,
        orderId,
        trace_id: traceId
      }
    });
  }

  return result;
}

async function createMockPaymentIntent(req, res) {
  try {
    const { order_id, provider_name } = req.body;

    const order = await DonationOrder.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isOwner = order.donor_user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: not allowed for this order' });
    }

    const provider = getProvider(provider_name || process.env.PAYMENT_PROVIDER || 'mock');
    const intent = await provider.createPaymentIntent({
      amount: Number(order.total_amount),
      currency: order.currency,
      metadata: { order_id: String(order.id), donor_user_id: String(order.donor_user_id) },
      idempotencyKey: `intent_${order.id}`
    });

    const [transaction] = await PaymentTransaction.findOrCreate({
      where: { donation_order_id: order.id },
      defaults: {
        donation_order_id: order.id,
        provider_name: provider_name || 'mock_stripe',
        transaction_id: intent.providerTransactionId,
        status: 'pending',
        amount: order.total_amount,
        currency: order.currency,
        raw_payload: intent.payload
      }
    });

    logger.info('payment.intent.created', {
      orderId: order.id,
      paymentTransactionId: transaction.id,
      provider: transaction.provider_name
    });

    return res.status(201).json({
      message: 'Payment intent created',
      transaction,
      client_secret: intent.clientSecret || null
    });
  } catch (error) {
    logger.error('payment.intent.failed', { orderId: req.body?.order_id, error: error.message });
    return res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
  }
}

async function confirmMockPayment(req, res) {
  try {
    const { transaction_id, success } = req.body;

    const transaction = await PaymentTransaction.findByPk(transaction_id, {
      include: [{ model: DonationOrder, as: 'order' }]
    });

    if (!transaction || !transaction.order) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const order = transaction.order;

    if (req.user) {
      const isOwner = order.donor_user_id === req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Forbidden: not allowed for this transaction' });
      }
    }

    await processPaymentEvent({
      providerName: transaction.provider_name,
      eventId: `manual_confirm_${transaction.id}_${success ? 'paid' : 'failed'}`,
      orderId: order.id,
      providerTransactionId: transaction.transaction_id,
      status: success ? 'paid' : 'failed',
      payload: { transaction_id, success }
    });

    return res.status(200).json({ message: 'Payment confirmation processed', transaction, order });
  } catch (error) {
    logger.error('payment.confirm.failed', { transactionId: req.body?.transaction_id, error: error.message });
    return res.status(500).json({ message: 'Failed to confirm payment', error: error.message });
  }
}

async function paymentCallback(req, res) {
  try {
    const secretHeader = req.headers['x-webhook-secret'];
    if (!secretHeader || secretHeader !== process.env.PAYMENT_WEBHOOK_SECRET) {
      return res.status(401).json({ message: 'Invalid callback signature' });
    }

    const { order_id, transaction_id, provider_name, status, event_id } = req.body;
    const normalizedStatus = ['paid', 'failed', 'refunded', 'partially_paid'].includes(status) ? status : 'failed';

    const result = await processPaymentEvent({
      providerName: provider_name || 'callback_provider',
      eventId: event_id || `callback_${transaction_id || 'unknown'}_${order_id}_${normalizedStatus}`,
      orderId: Number(order_id),
      providerTransactionId: transaction_id,
      status: normalizedStatus,
      payload: req.body
    });

    return res.status(200).json({ message: result.duplicate ? 'Duplicate callback ignored' : 'Callback processed' });
  } catch (error) {
    logger.error('payment.callback.failed', { error: error.message });
    return res.status(500).json({ message: 'Payment callback failed', error: error.message });
  }
}

async function stripeWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    const provider = getProvider('stripe');
    const event = provider.verifyWebhookSignature(req.body, signature);
    logger.info('payment.webhook.stripe.received', { eventType: event?.type || 'unknown' });
    const mapped = provider.mapWebhookEvent(event);

    if (!mapped.orderId) {
      return res.status(400).json({ message: 'Missing order_id in Stripe metadata' });
    }

    const result = await processPaymentEvent({
      providerName: mapped.providerName,
      eventId: mapped.eventId,
      orderId: mapped.orderId,
      providerTransactionId: mapped.transactionId,
      status: mapped.status,
      payload: mapped.payload
    });

    return res.status(200).json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    logger.error('payment.webhook.stripe.failed', { error: error.message });
    await sendOperationalAlert({
      title: 'Alerte webhook Stripe',
      body: `Webhook Stripe invalide ou en erreur: ${error.message}`,
      context: { providerName: 'stripe' }
    });
    return res.status(400).json({ message: 'Stripe webhook failed', error: error.message });
  }
}

async function mockWebhook(req, res) {
  try {
    const signature = req.headers['x-provider-signature'];
    const provider = getProvider('mock');
    const event = provider.verifyWebhookSignature(req.body, signature);
    logger.info('payment.webhook.mock.received', { eventType: event?.type || 'unknown' });
    const mapped = provider.mapWebhookEvent(event);

    const normalizedStatus = ['paid', 'failed', 'refunded', 'partially_paid'].includes(mapped.status)
      ? mapped.status
      : 'failed';
    const result = await processPaymentEvent({
      providerName: mapped.providerName,
      eventId: mapped.eventId,
      orderId: mapped.orderId,
      providerTransactionId: mapped.transactionId,
      status: normalizedStatus,
      payload: mapped.payload
    });

    return res.status(200).json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    logger.error('payment.webhook.mock.failed', { error: error.message });
    await sendOperationalAlert({
      title: 'Alerte webhook Mock',
      body: `Webhook Mock invalide ou en erreur: ${error.message}`,
      context: { providerName: 'mock' }
    });
    return res.status(400).json({ message: 'Mock webhook failed', error: error.message });
  }
}

async function getPaymentById(req, res) {
  try {
    const transaction = await PaymentTransaction.findByPk(req.params.id, {
      include: [{ model: DonationOrder, as: 'order' }]
    });

    if (!transaction || !transaction.order) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const isOwner = transaction.order.donor_user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: not allowed for this transaction' });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch payment transaction', error: error.message });
  }
}

module.exports = {
  createMockPaymentIntent,
  confirmMockPayment,
  paymentCallback,
  stripeWebhook,
  mockWebhook,
  getPaymentById,
  processPaymentEvent
};
