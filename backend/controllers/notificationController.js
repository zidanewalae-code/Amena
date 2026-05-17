const { Notification, Order, Purchase, Donator, DeliveryPerson } = require('../models');

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function loadNotification(notificationId) {
  return Notification.findByPk(notificationId, {
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          { model: Purchase, as: 'purchase', include: [{ model: Donator, as: 'donator' }] },
          { model: DeliveryPerson, as: 'deliveryPerson' }
        ]
      }
    ]
  });
}

async function loadOrder(orderId) {
  return Order.findByPk(orderId, {
    include: [
      { model: Purchase, as: 'purchase', include: [{ model: Donator, as: 'donator' }] },
      { model: DeliveryPerson, as: 'deliveryPerson' }
    ]
  });
}

function canAccessNotification(user, notification) {
  if (user.role === 'admin') {
    return true;
  }

  const order = notification?.order;
  if (!order) {
    return false;
  }

  if (user.role === 'donator') {
    return Number(order?.purchase?.donor_id) === Number(user.user_id);
  }

  if (user.role === 'delivery_person') {
    return Number(order?.delivery_person_id) === Number(user.user_id);
  }

  return false;
}

async function getAllNotifications(req, res) {
  try {
    const notifications = await Notification.findAll({
      order: [['notification_id', 'DESC']],
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Purchase, as: 'purchase', include: [{ model: Donator, as: 'donator' }] },
            { model: DeliveryPerson, as: 'deliveryPerson' }
          ]
        }
      ]
    });

    if (req.user.role === 'admin') {
      return res.status(200).json(notifications);
    }

    const ownNotifications = notifications.filter((notification) => canAccessNotification(req.user, notification));
    return res.status(200).json(ownNotifications);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
}

async function getNotificationById(req, res) {
  try {
    const notification = await loadNotification(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (!canAccessNotification(req.user, notification)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    return res.status(200).json(notification);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notification', error: error.message });
  }
}

async function createNotification(req, res) {
  try {
    const { message, date, is_read, order_id } = req.body;

    if (req.user.role !== 'admin') {
      if (!order_id) {
        return res.status(400).json({ message: 'order_id is required' });
      }

      const order = await loadOrder(order_id);
      if (!order || !canAccessNotification(req.user, { order })) {
        return res.status(403).json({ message: 'Forbidden: role not allowed' });
      }
    }

    const created = await Notification.create({
      message,
      date: date || today(),
      is_read: is_read !== undefined ? Boolean(is_read) : false,
      order_id: order_id || null
    });

    return res.status(201).json(await loadNotification(created.notification_id));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create notification', error: error.message });
  }
}

async function updateNotification(req, res) {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    const loadedNotification = await loadNotification(req.params.id);
    if (!canAccessNotification(req.user, loadedNotification)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const { message, date, is_read, order_id } = req.body;

    if (req.user.role !== 'admin' && order_id !== undefined && Number(order_id) !== Number(notification.order_id)) {
      const targetOrder = await loadOrder(order_id);
      if (!targetOrder || !canAccessNotification(req.user, { order: targetOrder })) {
        return res.status(403).json({ message: 'Forbidden: role not allowed' });
      }
    }

    if (message !== undefined) notification.message = message;
    if (date !== undefined) notification.date = date;
    if (is_read !== undefined) notification.is_read = Boolean(is_read);
    if (order_id !== undefined) notification.order_id = order_id;
    await notification.save();
    return res.status(200).json(await loadNotification(notification.notification_id));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
}

async function deleteNotification(req, res) {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    const loadedNotification = await loadNotification(req.params.id);
    if (!canAccessNotification(req.user, loadedNotification)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    await notification.destroy();
    return res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
}

module.exports = { getAllNotifications, getNotificationById, createNotification, updateNotification, deleteNotification };