// Email service sends donation receipts with a simple retry strategy.
const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendWithRetry(mailOptions, maxAttempts = 3) {
  const transport = createTransport();
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await transport.sendMail(mailOptions);
      logger.info('email.sent', { to: mailOptions.to, attempt });
      return result;
    } catch (error) {
      lastError = error;
      logger.warn('email.retry', { to: mailOptions.to, attempt, error: error.message });
    }
  }

  throw lastError;
}

module.exports = {
  sendWithRetry
};
