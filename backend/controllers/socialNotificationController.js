// In-app notification listing + email mock trigger for beginner-friendly flows.
const { Notification } = require('../models');
const { sendWithRetry } = require('../services/notifications/emailService');

async function listMyNotifications(req, res) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return res.status(200).json({
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
      items: rows
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list notifications', error: error.message });
  }
}

async function markNotificationRead(req, res) {
  try {
    const item = await Notification.findByPk(req.params.id);
    if (!item || Number(item.user_id) !== Number(req.user.id)) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    item.is_read = true;
    await item.save();
    return res.status(200).json({ message: 'Notification marked as read', notification: item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
}

async function createAdminNotification(req, res) {
  try {
    const item = await Notification.create({
      user_id: req.body.user_id,
      channel: 'in_app',
      title: req.body.title,
      body: req.body.body,
      is_read: false
    });

    return res.status(201).json({ message: 'Notification created', notification: item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create notification', error: error.message });
  }
}

async function sendEmailMock(req, res) {
  try {
    await sendWithRetry({
      from: process.env.MAIL_FROM || 'no-reply@amena.tn',
      to: req.body.to,
      subject: req.body.subject || 'Amena notification',
      text: req.body.text || 'Notification email test'
    });

    return res.status(200).json({ message: 'Email mock sent' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send email mock', error: error.message });
  }
}

module.exports = {
  listMyNotifications,
  markNotificationRead,
  createAdminNotification,
  sendEmailMock
};
