const { sequelize, Order, Purchase, DeliveryPerson, Donator, Payment } = require('../models');

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function loadOrder(orderId) {
  return Order.findByPk(orderId, {
    include: [
      { model: Purchase, as: 'purchase', include: [{ model: Donator, as: 'donator' }] },
      { model: DeliveryPerson, as: 'deliveryPerson' },
      { model: Payment, as: 'payment' }
    ]
  });
}

function isOrderOwner(user, order) {
  const donorId = order?.purchase?.donor_id;
  const deliveryPersonId = order?.delivery_person_id;

  if (user.role === 'donator') {
    return Number(donorId) === Number(user.user_id);
  }

  if (user.role === 'delivery_person') {
    return Number(deliveryPersonId) === Number(user.user_id);
  }

  return false;
}

function canReadAllOrders(user) {
  return user.role === 'admin' || user.role === 'organization';
}

async function getAllOrders(req, res) {
  try {
    const include = [
      { model: Purchase, as: 'purchase', include: [{ model: Donator, as: 'donator' }] },
      { model: DeliveryPerson, as: 'deliveryPerson' },
      { model: Payment, as: 'payment' }
    ];

    let orders = [];
    if (canReadAllOrders(req.user)) {
      orders = await Order.findAll({ order: [['order_id', 'DESC']], include });
    } else if (req.user.role === 'donator') {
      orders = await Order.findAll({
        order: [['order_id', 'DESC']],
        include: [
          {
            model: Purchase,
            as: 'purchase',
            required: true,
            where: { donor_id: req.user.user_id },
            include: [{ model: Donator, as: 'donator' }]
          },
          { model: DeliveryPerson, as: 'deliveryPerson' },
          { model: Payment, as: 'payment' }
        ]
      });
    } else if (req.user.role === 'delivery_person') {
      orders = await Order.findAll({
        order: [['order_id', 'DESC']],
        where: { delivery_person_id: req.user.user_id },
        include
      });
    } else {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await loadOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!canReadAllOrders(req.user) && !isOrderOwner(req.user, order)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }
    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
}

async function createOrder(req, res) {
  try {
    if (!['admin', 'organization', 'donator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const { donor_id, total_price, status, delivery_address, order_date, delivery_person_id, purchase_id } = req.body;
    const ownerDonorId = req.user.role === 'donator' ? req.user.user_id : donor_id;

    if (!ownerDonorId || !delivery_address) {
      return res.status(400).json({ message: 'donor_id and delivery_address are required' });
    }

    const order = await sequelize.transaction(async (transaction) => {
      let purchase = null;

      if (purchase_id) {
        purchase = await Purchase.findByPk(purchase_id, { transaction });
      } else {
        purchase = await Purchase.create(
          { date: order_date || today(), total_price: total_price || 0, donor_id: ownerDonorId },
          { transaction }
        );
      }

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      return Order.create(
        {
          status: status || 'pending',
          delivery_address,
          order_date: order_date || today(),
          purchase_id: purchase.purchase_id,
          delivery_person_id: delivery_person_id || null
        },
        { transaction }
      );
    });

    return res.status(201).json(await loadOrder(order.order_id));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
}

async function updateOrder(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const loadedOrder = await loadOrder(order.order_id);
    if (!canReadAllOrders(req.user) && !isOrderOwner(req.user, loadedOrder)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    if (!['admin', 'organization', 'donator', 'delivery_person'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const { status, delivery_address, order_date, delivery_person_id, total_price } = req.body;
    if (req.user.role === 'delivery_person') {
      if (status !== undefined) order.status = status;
    } else {
      if (status !== undefined) order.status = status;
      if (delivery_address !== undefined) order.delivery_address = delivery_address;
      if (order_date !== undefined) order.order_date = order_date;
      if (delivery_person_id !== undefined) order.delivery_person_id = delivery_person_id;
    }

    await sequelize.transaction(async (transaction) => {
      await order.save({ transaction });

      if (total_price !== undefined && order.purchase_id) {
        const purchase = await Purchase.findByPk(order.purchase_id, { transaction });
        if (purchase) {
          purchase.total_price = total_price;
          if (order_date !== undefined) {
            purchase.date = order_date;
          }
          await purchase.save({ transaction });
        }
      }
    });

    return res.status(200).json(await loadOrder(order.order_id));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
}

async function deleteOrder(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const loadedOrder = await loadOrder(order.order_id);
    if (!canReadAllOrders(req.user) && !isOrderOwner(req.user, loadedOrder)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    if (!['admin', 'organization', 'donator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    await sequelize.transaction(async (transaction) => {
      if (order.purchase_id) {
        const purchase = await Purchase.findByPk(order.purchase_id, { transaction });
        if (purchase) {
          await purchase.destroy({ transaction });
          return;
        }
      }

      await order.destroy({ transaction });
    });

    return res.status(200).json({ message: 'Order deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
}

module.exports = { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder };