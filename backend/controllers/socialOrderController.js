// Controller for donor order/cart flow with stock decrement on checkout.
const sequelize = require('../config/db');
const { Op } = require('sequelize');
const { SocialOrder, SocialOrderItem, SocialProduct, SocialAssignment, SocialBeneficiary } = require('../models');

function parsePagination(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildOrderWhere(query, user) {
  const where = user.role === 'admin' ? {} : { user_id: user.id };
  if (query.status) where.status = String(query.status).toLowerCase();
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date[Op.gte] = new Date(query.from);
    if (query.to) where.date[Op.lte] = new Date(query.to);
  }
  return where;
}

async function createOrder(req, res) {
  try {
    const order = await SocialOrder.create({ user_id: req.user.id, status: 'pending', date: new Date() });
    return res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
}

async function addOrderItem(req, res) {
  try {
    const order = await SocialOrder.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = Number(order.user_id) === Number(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    if (order.status !== 'pending') return res.status(409).json({ message: 'Only pending orders can be modified' });

    const product = await SocialProduct.findByPk(req.body.product_id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const qty = Number(req.body.quantity || 1);
    if (qty <= 0) return res.status(400).json({ message: 'Quantity must be > 0' });

    const [item, created] = await SocialOrderItem.findOrCreate({
      where: { order_id: order.id, product_id: product.id },
      defaults: { order_id: order.id, product_id: product.id, quantity: qty }
    });

    if (!created) {
      item.quantity = Number(item.quantity) + qty;
      await item.save();
    }

    return res.status(201).json({ message: 'Item added to order', item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add item', error: error.message });
  }
}

async function checkoutOrder(req, res) {
  try {
    const result = await sequelize.transaction(async (dbTx) => {
      const order = await SocialOrder.findByPk(req.params.orderId, {
        transaction: dbTx,
        include: [{ model: SocialOrderItem, as: 'items', include: [{ model: SocialProduct, as: 'product' }] }]
      });

      if (!order) return { status: 404, body: { message: 'Order not found' } };
      const isOwner = Number(order.user_id) === Number(req.user.id);
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) return { status: 403, body: { message: 'Forbidden' } };
      if (order.status !== 'pending') return { status: 409, body: { message: 'Only pending order can checkout' } };
      if (!order.items?.length) return { status: 400, body: { message: 'Order has no items' } };

      for (const item of order.items) {
        const product = item.product;
        if (!product || Number(product.stock) < Number(item.quantity)) {
          return { status: 409, body: { message: `Insufficient stock for product #${item.product_id}` } };
        }
      }

      for (const item of order.items) {
        const product = item.product;
        product.stock = Number(product.stock) - Number(item.quantity);
        await product.save({ transaction: dbTx });
      }

      order.status = 'paid';
      await order.save({ transaction: dbTx });

      return { status: 200, body: { message: 'Order checked out', order } };
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to checkout order', error: error.message });
  }
}

async function listMyOrders(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = buildOrderWhere(req.query, req.user);
    const { count, rows } = await SocialOrder.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: SocialOrderItem, as: 'items', include: [{ model: SocialProduct, as: 'product' }] },
        { model: SocialAssignment, as: 'assignments', include: [{ model: SocialBeneficiary, as: 'beneficiary' }] }
      ],
      distinct: true,
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
    return res.status(500).json({ message: 'Failed to list orders', error: error.message });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await SocialOrder.findByPk(req.params.orderId, {
      include: [
        { model: SocialOrderItem, as: 'items', include: [{ model: SocialProduct, as: 'product' }] },
        { model: SocialAssignment, as: 'assignments', include: [{ model: SocialBeneficiary, as: 'beneficiary' }] }
      ]
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = Number(order.user_id) === Number(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
}

async function updateOrderItem(req, res) {
  try {
    const item = await SocialOrderItem.findByPk(req.params.itemId, {
      include: [{ model: SocialOrder, as: 'order' }]
    });
    if (!item || !item.order) return res.status(404).json({ message: 'Order item not found' });

    const isOwner = Number(item.order.user_id) === Number(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    if (item.order.status !== 'pending') return res.status(409).json({ message: 'Only pending order can be modified' });

    const qty = Number(req.body.quantity);
    if (!qty || qty <= 0) return res.status(400).json({ message: 'Quantity must be > 0' });

    item.quantity = qty;
    await item.save();
    return res.status(200).json({ message: 'Order item updated', item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order item', error: error.message });
  }
}

async function deleteOrderItem(req, res) {
  try {
    const item = await SocialOrderItem.findByPk(req.params.itemId, {
      include: [{ model: SocialOrder, as: 'order' }]
    });
    if (!item || !item.order) return res.status(404).json({ message: 'Order item not found' });

    const isOwner = Number(item.order.user_id) === Number(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    if (item.order.status !== 'pending') return res.status(409).json({ message: 'Only pending order can be modified' });

    await item.destroy();
    return res.status(200).json({ message: 'Order item deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete order item', error: error.message });
  }
}

async function setOrderStatus(req, res) {
  try {
    const order = await SocialOrder.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = req.body.status;
    await order.save();

    return res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
}

async function deleteOrder(req, res) {
  try {
    const order = await SocialOrder.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = Number(order.user_id) === Number(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    await order.destroy();
    return res.status(200).json({ message: 'Order deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
}

module.exports = {
  createOrder,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  checkoutOrder,
  listMyOrders,
  getOrderById,
  setOrderStatus,
  deleteOrder
};
