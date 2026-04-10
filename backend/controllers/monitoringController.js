// Monitoring endpoints for webhook delay detection and operational alerting.
const { Op } = require('sequelize');
const { DonationOrder, PaymentTransaction, User } = require('../models');
const logger = require('../utils/logger');
const {
  sendOperationalAlert,
  sendMonitoringAlertEmail,
  sendSlackAlert
} = require('../services/notifications/notificationService');
const { getProvider } = require('../services/payments/paymentProviderFactory');
const { processPaymentEvent } = require('./paymentController');

function getThresholdMinutes() {
  return Math.max(Number(process.env.WEBHOOK_ALERT_THRESHOLD_MIN || 10), 1);
}

function getEnvironmentName() {
  return process.env.APP_ENV || process.env.NODE_ENV || 'development';
}

function getMonitoredProviders() {
  const fallback = ['mock', 'stripe'];
  const configured = String(process.env.MONITORED_PAYMENT_PROVIDERS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  return configured.length ? configured : fallback;
}

async function fetchDelayedOrders(thresholdMinutes) {
  const thresholdDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

  return DonationOrder.findAll({
    where: {
      status: 'pending',
      [Op.or]: [{ last_webhook_at: null }, { last_webhook_at: { [Op.lt]: thresholdDate } }],
      created_at: { [Op.lt]: thresholdDate }
    },
    include: [{ model: PaymentTransaction, as: 'transaction' }],
    order: [['created_at', 'ASC']],
    limit: 500
  });
}

async function checkProvidersHealth() {
  const providers = getMonitoredProviders();
  const results = [];

  for (const providerName of providers) {
    const checkedAt = new Date().toISOString();
    try {
      const provider = getProvider(providerName);
      if (!provider.healthCheck) {
        results.push({ provider: providerName, available: null, checked_at: checkedAt, reason: 'healthCheck not implemented' });
        continue;
      }

      const status = await provider.healthCheck();
      results.push({
        provider: providerName,
        available: Boolean(status.available),
        latency_ms: Number(status.latency_ms || 0),
        reason: status.reason || null,
        checked_at: checkedAt
      });
    } catch (error) {
      results.push({
        provider: providerName,
        available: false,
        latency_ms: null,
        reason: error.message,
        checked_at: checkedAt
      });
    }
  }

  return results;
}

async function retryDelayedWebhooks(delayedOrders) {
  const maxAttempts = Math.max(Number(process.env.WEBHOOK_RETRY_MAX_ATTEMPTS || 3), 1);
  const results = [];

  for (const order of delayedOrders) {
    const tx = order.transaction;
    if (!tx?.provider_name || !tx?.transaction_id) {
      results.push({ order_id: order.id, retried: false, reason: 'missing provider metadata' });
      continue;
    }

    const retryCount = Number(tx.raw_payload?.monitoring_retry_count || 0);
    if (retryCount >= maxAttempts) {
      results.push({ order_id: order.id, retried: false, reason: 'max retry reached' });
      continue;
    }

    try {
      const provider = getProvider(tx.provider_name);
      if (!provider.fetchPaymentStatus) {
        results.push({ order_id: order.id, retried: false, reason: 'fetchPaymentStatus not supported' });
        continue;
      }

      const statusResult = await provider.fetchPaymentStatus(tx.transaction_id);
      tx.raw_payload = {
        ...(tx.raw_payload || {}),
        monitoring_retry_count: retryCount + 1,
        monitoring_last_retry_at: new Date().toISOString(),
        monitoring_last_retry_status: statusResult?.status || 'pending'
      };
      await tx.save();

      if (statusResult?.status && ['paid', 'partially_paid', 'failed', 'refunded'].includes(statusResult.status)) {
        await processPaymentEvent({
          providerName: tx.provider_name,
          eventId: `retry_${tx.id}_${Date.now()}`,
          orderId: order.id,
          providerTransactionId: tx.transaction_id,
          status: statusResult.status,
          payload: {
            source: 'monitoring_retry',
            order_id: order.id,
            transaction_id: tx.transaction_id,
            provider_name: tx.provider_name,
            status: statusResult.status,
            retry_count: retryCount + 1,
            trace_id: `retry_trace_${tx.id}_${Date.now()}`,
            ...(statusResult.payload ? { provider_payload: statusResult.payload } : {})
          }
        });
      }

      results.push({ order_id: order.id, retried: true, status: statusResult?.status || 'pending' });
    } catch (error) {
      results.push({ order_id: order.id, retried: false, reason: error.message });
    }
  }

  return results;
}

async function sendMonitoringAlerts({ delayedOrders, thresholdMinutes, providerStatuses, source }) {
  const delayedCount = delayedOrders.length;
  const downProviders = providerStatuses.filter((p) => p.available === false);
  const environment = getEnvironmentName();

  if (!delayedCount && !downProviders.length) return;

  const title = source === 'heartbeat' ? 'Alerte monitoring heartbeat' : 'Alerte monitoring webhook';
  const bodyParts = [];
  if (delayedCount) bodyParts.push(`${delayedCount} orders pending sans webhook au-dela de ${thresholdMinutes} min.`);
  if (downProviders.length) bodyParts.push(`Providers indisponibles: ${downProviders.map((p) => p.provider).join(', ')}`);
  const body = bodyParts.join(' ');

  logger.warn(`monitoring.${source}.alert`, {
    thresholdMinutes,
    delayedCount,
    downProviders: downProviders.map((p) => p.provider),
    environment
  });

  await sendOperationalAlert({
    title,
    body,
    context: {
      thresholdMinutes,
      delayedCount,
      downProviders: downProviders.map((p) => p.provider),
      environment,
      source
    }
  });

  const recipientList = String(process.env.MONITORING_ALERT_EMAILS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  if (!recipientList.length) {
    const admins = await User.findAll({ where: { role: 'admin', is_active: true }, attributes: ['email'] });
    recipientList.push(...admins.map((a) => a.email).filter(Boolean));
  }

  if (recipientList.length) {
    await sendMonitoringAlertEmail({
      recipients: recipientList,
      subject: `[Amena][${environment}] ${source} alert`,
      text: `${body}\nThreshold: ${thresholdMinutes} min\nOrders: ${delayedOrders.map((o) => o.id).join(', ') || '-'}\nDown providers: ${downProviders.map((p) => p.provider).join(', ') || '-'}`
    });
  }

  await sendSlackAlert({
    title,
    body,
    context: {
      thresholdMinutes,
      delayedCount,
      downProviders: downProviders.map((p) => p.provider).join(',') || '-',
      source,
      environment
    }
  });
}

async function getWebhookMonitoring(req, res) {
  try {
    const thresholdMinutes = getThresholdMinutes();
    const delayedOrders = await fetchDelayedOrders(thresholdMinutes);
    const retryResults = await retryDelayedWebhooks(delayedOrders);
    await sendMonitoringAlerts({ delayedOrders, thresholdMinutes, providerStatuses: [], source: 'webhooks' });

    return res.status(200).json({
      environment: getEnvironmentName(),
      checked_at: new Date().toISOString(),
      threshold_minutes: thresholdMinutes,
      delayed_orders_count: delayedOrders.length,
      retry_results: retryResults,
      delayed_orders: delayedOrders.map((o) => ({
        order_id: o.id,
        order_reference: o.order_reference,
        order_status: o.status,
        payment_status: o.transaction?.status || null,
        provider: o.transaction?.provider_name || null,
        last_webhook_at: o.last_webhook_at,
        created_at: o.created_at
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to monitor webhooks', error: error.message });
  }
}

async function getHeartbeat(req, res) {
  try {
    const checkedAt = new Date().toISOString();
    const thresholdMinutes = getThresholdMinutes();
    const delayedOrders = await fetchDelayedOrders(thresholdMinutes);
    const retryResults = await retryDelayedWebhooks(delayedOrders);
    const providerStatuses = await checkProvidersHealth();
    const downProviders = providerStatuses.filter((p) => p.available === false).map((p) => p.provider);

    let issueType = 'healthy';
    if (delayedOrders.length && downProviders.length) issueType = 'provider_unavailable';
    else if (delayedOrders.length) issueType = 'webhook_absent_or_delayed';
    else if (downProviders.length) issueType = 'provider_unavailable';

    if (issueType !== 'healthy') {
      await sendMonitoringAlerts({ delayedOrders, thresholdMinutes, providerStatuses, source: 'heartbeat' });
    }

    logger.info('monitoring.heartbeat.checked', {
      checkedAt,
      issueType,
      delayedCount: delayedOrders.length,
      downProviders
    });

    return res.status(200).json({
      environment: getEnvironmentName(),
      checked_at: checkedAt,
      threshold_minutes: thresholdMinutes,
      issue_type: issueType,
      delayed_orders_count: delayedOrders.length,
      retry_results: retryResults,
      delayed_orders: delayedOrders.map((o) => ({
        order_id: o.id,
        order_reference: o.order_reference,
        order_status: o.status,
        payment_status: o.transaction?.status || null,
        provider: o.transaction?.provider_name || null,
        last_webhook_at: o.last_webhook_at,
        created_at: o.created_at
      })),
      providers: providerStatuses
    });
  } catch (error) {
    logger.error('monitoring.heartbeat.failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to check heartbeat', error: error.message });
  }
}

module.exports = {
  getWebhookMonitoring,
  getHeartbeat
};
