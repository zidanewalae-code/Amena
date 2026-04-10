// Notification service persists in-app messages and sends donation receipt emails.
const { Notification, User } = require('../../models');
const { sendWithRetry } = require('./emailService');
const logger = require('../../utils/logger');

async function sendPaymentSuccess({ user, order, donations }) {
  const title = 'Paiement confirme';
  const body = `Votre paiement ${order.order_reference} de ${order.total_amount} ${order.currency} a ete confirme.`;

  await Notification.create({
    user_id: user.id,
    channel: 'in_app',
    title,
    body,
    is_read: false
  });

  const donationLines = (donations || [])
    .map((d) => `- Besoin #${d.need_id}: ${d.amount} ${order.currency}`)
    .join('\n');

  const mailText = [
    'Bonjour,',
    '',
    `Votre donation est confirmee.`,
    `Reference: ${order.order_reference}`,
    `Date: ${new Date(order.paid_at || Date.now()).toISOString()}`,
    `Montant total: ${order.total_amount} ${order.currency}`,
    '',
    'Details des besoins:',
    donationLines || '- Aucun detail',
    '',
    'Merci pour votre soutien.',
    'Equipe Amena'
  ].join('\n');

  await sendWithRetry({
    from: process.env.MAIL_FROM || 'no-reply@amena.tn',
    to: user.email,
    subject: `[Amena] Recu de donation ${order.order_reference}`,
    text: mailText
  });

  logger.info('notification.payment_success', { userId: user.id, orderId: order.id });
}

async function sendOperationalAlert({ title, body, context }) {
  const admins = await User.findAll({
    where: { role: 'admin', is_active: true },
    attributes: ['id', 'email']
  });

  for (const admin of admins) {
    await Notification.create({
      user_id: admin.id,
      channel: 'in_app',
      title,
      body,
      is_read: false
    });
  }

  logger.warn('notification.operational_alert', {
    adminCount: admins.length,
    title,
    ...context
  });
}

async function sendMonitoringAlertEmail({ recipients, subject, text }) {
  const { sendWithRetry } = require('./emailService');
  if (!recipients?.length) return;

  await sendWithRetry({
    from: process.env.MAIL_FROM || 'no-reply@amena.tn',
    to: recipients.join(','),
    subject,
    text
  });

  logger.warn('notification.monitoring_email', { recipientsCount: recipients.length, subject });
}

async function sendSlackAlert({ title, body, context }) {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  const payload = {
    text: `*${title}*\n${body}`,
    attachments: [
      {
        color: '#bf4342',
        fields: Object.entries(context || {}).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        }))
      }
    ]
  };

  const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error('notification.slack.failed', { status: response.status, text });
    return;
  }

  logger.warn('notification.slack.sent', { title });
}

module.exports = {
  sendPaymentSuccess,
  sendOperationalAlert,
  sendMonitoringAlertEmail,
  sendSlackAlert
};
