// Admin KPI endpoint for donations/orders/payments overview.
const { fn, col } = require('sequelize');
const { SocialDonation, SocialOrder, SocialOrderItem, SocialProduct } = require('../models');

async function getKpis(req, res) {
  try {
    const [donationAgg, orderCount, pendingOrders, canceledOrders] = await Promise.all([
      SocialDonation.findOne({
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total_donations_amount']],
        where: { status: 'validated' },
        raw: true
      }),
      SocialOrder.count(),
      SocialOrder.count({ where: { status: 'pending' } }),
      SocialOrder.count({ where: { status: 'canceled' } })
    ]);

    const soldProducts = await SocialOrderItem.findAll({
      attributes: ['product_id', [fn('SUM', col('quantity')), 'quantity_sold']],
      group: ['product_id'],
      include: [{ model: SocialProduct, as: 'product', attributes: ['id', 'name'] }]
    });

    return res.status(200).json({
      totals: {
        total_donations_amount: Number(donationAgg?.total_donations_amount || 0),
        orders_count: orderCount,
        pending_orders: pendingOrders,
        canceled_orders: canceledOrders
      },
      top_products: soldProducts
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compute KPIs', error: error.message });
  }
}

module.exports = {
  getKpis
};
