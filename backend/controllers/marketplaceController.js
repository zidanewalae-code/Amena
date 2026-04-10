// Marketplace controller covering listing, recommendations, cart checkout, and impact tracking.
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const {
  MarketplaceItem,
  MarketplaceOrder,
  MarketplaceOrderItem,
  MarketplaceReport,
  User,
  Notification
} = require('../models');

function parsePagination(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 12), 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function computeImpact(item) {
  if (!item) return 1;
  const score = item.urgent_need ? 2 : 1;
  return item.is_donation ? score + 1 : score;
}

async function listItems(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = { status: 'active' };

    if (req.query.category) where.category = req.query.category;
    if (req.query.size) where.size = req.query.size;
    if (req.query.urgency === 'urgent') where.urgent_need = true;
    if (req.query.price_min || req.query.price_max) {
      where.price = {};
      if (req.query.price_min) where.price[Op.gte] = Number(req.query.price_min);
      if (req.query.price_max) where.price[Op.lte] = Number(req.query.price_max);
    }
    if (req.query.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${req.query.search}%` } },
        { description: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const order = [['created_at', 'DESC']];
    const { count, rows } = await MarketplaceItem.findAndCountAll({
      where,
      include: [{ model: User, as: 'seller', attributes: ['id', 'full_name'] }],
      limit,
      offset,
      order
    });

    let items = rows.map((item) => ({
      ...item.toJSON(),
      impact_people: computeImpact(item)
    }));

    if (String(req.query.recommended || '').toLowerCase() === 'true') {
      items = items.sort((a, b) => Number(b.urgent_need) - Number(a.urgent_need) || Number(b.trust_score) - Number(a.trust_score));
    }

    return res.status(200).json({
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
      items
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list marketplace items', error: error.message });
  }
}

async function listRecommendations(req, res) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 8), 1), 30);
    const authUser = req.user || null;
    let preferredCategories = [];

    if (authUser?.id) {
      const lastOrders = await MarketplaceOrder.findAll({
        where: { buyer_user_id: authUser.id },
        include: [{ model: MarketplaceOrderItem, as: 'items', include: [{ model: MarketplaceItem, as: 'item' }] }],
        limit: 10,
        order: [['created_at', 'DESC']]
      });

      preferredCategories = lastOrders
        .flatMap((order) => (order.items || []).map((row) => row.item?.category).filter(Boolean))
        .slice(0, 4);
    }

    const where = { status: 'active' };
    if (preferredCategories.length) where.category = { [Op.in]: preferredCategories };

    const items = await MarketplaceItem.findAll({
      where,
      order: [['urgent_need', 'DESC'], ['trust_score', 'DESC'], ['created_at', 'DESC']],
      limit
    });

    return res.status(200).json({
      items: items.map((item) => ({ ...item.toJSON(), impact_people: computeImpact(item) }))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load recommendations', error: error.message });
  }
}

async function getMyImpact(req, res) {
  try {
    const [myItems, myOrders] = await Promise.all([
      MarketplaceItem.findAll({ where: { seller_user_id: req.user.id } }),
      MarketplaceOrder.findAll({ where: { buyer_user_id: req.user.id } })
    ]);

    const itemsDonated = myItems.filter((item) => item.is_donation).length;
    const itemsBought = myOrders.length;
    const totalImpact = myOrders.reduce((sum, order) => sum + Number(order.impact_people_count || 0), 0);
    const impactScore = itemsDonated * 8 + itemsBought * 5 + totalImpact * 3;

    const badges = [];
    if (itemsDonated >= 3) badges.push('Top Donor');
    if (totalImpact >= 10) badges.push('Helper');
    if (itemsBought >= 5) badges.push('Impact Shopper');
    if (!badges.length) badges.push('Rising Impact');

    return res.status(200).json({
      items_donated: itemsDonated,
      items_bought: itemsBought,
      total_impact: totalImpact,
      impact_score: impactScore,
      badges
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compute impact score', error: error.message });
  }
}

async function getItemById(req, res) {
  try {
    const item = await MarketplaceItem.findByPk(req.params.id, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'full_name'] }]
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.views_count = Number(item.views_count || 0) + 1;
    await item.save();

    return res.status(200).json({
      ...item.toJSON(),
      impact_message: 'Buying this helps a family in need.',
      transparency: {
        association_name: item.association_name || 'Verified local association',
        trust_score: item.trust_score
      },
      impact_people: computeImpact(item)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch item', error: error.message });
  }
}

async function createItem(req, res) {
  try {
    const payload = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || 'clothes',
      size: req.body.size || null,
      condition: req.body.condition || 'good',
      image_url: req.body.image_url || null,
      price: Number(req.body.price || 0),
      is_free: Boolean(req.body.is_free),
      is_donation: req.body.is_donation !== undefined ? Boolean(req.body.is_donation) : true,
      urgent_need: Boolean(req.body.urgent_need),
      association_name: req.body.association_name || null,
      trust_score: Math.min(Math.max(Number(req.body.trust_score || 70), 0), 100),
      seller_user_id: req.user.id,
      status: 'active'
    };

    const item = await MarketplaceItem.create(payload);
    return res.status(201).json({ message: 'Item created', item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create item', error: error.message });
  }
}

async function listMyItems(req, res) {
  try {
    const items = await MarketplaceItem.findAll({
      where: { seller_user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(items.map((item) => ({
      ...item.toJSON(),
      impact_people: computeImpact(item)
    })));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list user items', error: error.message });
  }
}

async function checkout(req, res) {
  try {
    const inputItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (!inputItems.length) return res.status(400).json({ message: 'Cart is empty' });

    const result = await sequelize.transaction(async (tx) => {
      const ids = inputItems.map((i) => Number(i.item_id)).filter(Boolean);
      const items = await MarketplaceItem.findAll({ where: { id: ids, status: 'active' }, transaction: tx });
      if (!items.length) return { status: 404, body: { message: 'No valid items found' } };

      let total = 0;
      let impactPeople = 0;
      for (const item of items) {
        const qty = Number(inputItems.find((x) => Number(x.item_id) === Number(item.id))?.quantity || 1);
        total += Number(item.price) * qty;
        impactPeople += computeImpact(item);
      }

      const previousOrdersCount = await MarketplaceOrder.count({
        where: {
          buyer_user_id: req.user.id,
          created_at: { [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) }
        },
        transaction: tx
      });
      const suspicious = previousOrdersCount >= 4;

      const order = await MarketplaceOrder.create(
        {
          buyer_user_id: req.user.id,
          total_amount: total,
          impact_people_count: Math.max(impactPeople, 1),
          status: 'purchased',
          share_code: `impact-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        },
        { transaction: tx }
      );

      for (const item of items) {
        const qty = Number(inputItems.find((x) => Number(x.item_id) === Number(item.id))?.quantity || 1);
        await MarketplaceOrderItem.create(
          {
            order_id: order.id,
            item_id: item.id,
            quantity: qty,
            unit_price: item.price
          },
          { transaction: tx }
        );
        item.status = 'reserved';
        await item.save({ transaction: tx });
      }

      if (suspicious) {
        await Notification.create(
          {
            user_id: req.user.id,
            channel: 'in_app',
            title: 'Fraud check notice',
            body: 'Unusual purchasing activity detected. Our trust system will review this order.',
            is_read: false
          },
          { transaction: tx }
        );
      }

      return {
        status: 201,
        body: {
          message: 'Thank you. You made an impact!',
          order_id: order.id,
          total_amount: Number(order.total_amount),
          impact_people_count: order.impact_people_count,
          suspicious_activity_flag: suspicious,
          share_link: `/orders?share=${order.share_code}`,
          timeline: [
            { key: 'purchased', done: true },
            { key: 'picked_up', done: false },
            { key: 'delivered_to_association', done: false },
            { key: 'given_to_beneficiary', done: false }
          ]
        }
      };
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process checkout', error: error.message });
  }
}

async function listMyOrders(req, res) {
  try {
    const orders = await MarketplaceOrder.findAll({
      where: { buyer_user_id: req.user.id },
      include: [
        {
          model: MarketplaceOrderItem,
          as: 'items',
          include: [{ model: MarketplaceItem, as: 'item' }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const mapped = orders.map((order) => {
      const statusIndex = ['purchased', 'picked_up', 'delivered_to_association', 'given_to_beneficiary'].indexOf(order.status);
      return {
        ...order.toJSON(),
        timeline: [
          { key: 'purchased', done: statusIndex >= 0 },
          { key: 'picked_up', done: statusIndex >= 1 },
          { key: 'delivered_to_association', done: statusIndex >= 2 },
          { key: 'given_to_beneficiary', done: statusIndex >= 3 }
        ]
      };
    });

    return res.status(200).json(mapped);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list orders', error: error.message });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const allowed = ['purchased', 'picked_up', 'delivered_to_association', 'given_to_beneficiary', 'canceled'];
    const status = req.body.status;
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const order = await MarketplaceOrder.findByPk(req.params.id, {
      include: [{ model: MarketplaceOrderItem, as: 'items', include: [{ model: MarketplaceItem, as: 'item' }] }]
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = Number(order.buyer_user_id) === Number(req.user.id);
    const canModerate = ['admin', 'organization', 'courier'].includes(req.user.role);
    if (!isOwner && !canModerate) return res.status(403).json({ message: 'Forbidden' });

    order.status = status;
    await order.save();

    if (status === 'given_to_beneficiary') {
      for (const row of order.items || []) {
        if (row.item) {
          row.item.status = 'delivered';
          await row.item.save();
        }
      }
    }

    return res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
}

async function reportItem(req, res) {
  try {
    const item = await MarketplaceItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const existing = await MarketplaceReport.findOne({
      where: {
        item_id: item.id,
        reporter_user_id: req.user.id,
        status: { [Op.in]: ['open', 'reviewing'] }
      }
    });
    if (existing) {
      return res.status(200).json({ message: 'Report already submitted and under review.' });
    }

    await MarketplaceReport.create({
      item_id: item.id,
      reporter_user_id: req.user.id,
      reason: req.body.reason || 'Suspicious listing reported by user.',
      status: 'open'
    });

    await Notification.create({
      user_id: req.user.id,
      channel: 'in_app',
      title: 'Report submitted',
      body: req.body.reason || 'A trust/safety report was submitted for review.',
      is_read: false
    });

    return res.status(200).json({ message: 'Report submitted. Moderation team has been notified.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit report', error: error.message });
  }
}

async function getFraudAlerts(req, res) {
  try {
    const reports = await MarketplaceReport.findAll({
      where: { status: { [Op.in]: ['open', 'reviewing'] } },
      include: [{ model: MarketplaceItem, as: 'item', attributes: ['id', 'title', 'seller_user_id', 'trust_score'] }],
      order: [['created_at', 'DESC']],
      limit: 100
    });

    const groupedByItem = reports.reduce((acc, row) => {
      const id = Number(row.item_id);
      if (!acc[id]) {
        acc[id] = {
          item_id: id,
          item_title: row.item?.title || `item #${id}`,
          seller_user_id: row.item?.seller_user_id || null,
          trust_score: row.item?.trust_score ?? null,
          open_reports: 0,
          latest_reason: row.reason,
          latest_at: row.created_at
        };
      }
      acc[id].open_reports += 1;
      return acc;
    }, {});

    const suspiciousOrders = await MarketplaceOrder.findAll({
      where: {
        created_at: { [Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      },
      attributes: ['buyer_user_id', [sequelize.fn('COUNT', sequelize.col('id')), 'orders_count']],
      group: ['buyer_user_id'],
      having: sequelize.literal('COUNT(id) >= 4')
    });

    return res.status(200).json({
      open_reports_total: reports.length,
      item_alerts: Object.values(groupedByItem).sort((a, b) => b.open_reports - a.open_reports),
      suspicious_buyers: suspiciousOrders
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch fraud alerts', error: error.message });
  }
}

module.exports = {
  listItems,
  listRecommendations,
  getMyImpact,
  getItemById,
  createItem,
  listMyItems,
  checkout,
  listMyOrders,
  updateOrderStatus,
  reportItem,
  getFraudAlerts
};
