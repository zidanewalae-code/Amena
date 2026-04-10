// Handles donation read endpoints by user, by need, and test summary debug endpoint.
const { DonationCart, DonationCartItem, DonationOrder, Donation, PaymentTransaction, Need } = require('../models');

async function getDonationsByUser(req, res) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;

    const { count, rows } = await Donation.findAndCountAll({
      where: { donor_user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [{ model: Need, as: 'need', attributes: ['id', 'title', 'status', 'amount_target', 'amount_collected'] }]
    });

    return res.status(200).json({
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
      items: rows
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch donations by user', error: error.message });
  }
}

async function getDonationsByNeed(req, res) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;

    const { count, rows } = await Donation.findAndCountAll({
      where: { need_id: req.params.needId },
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
    return res.status(500).json({ message: 'Failed to fetch donations by need', error: error.message });
  }
}

async function testSummary(req, res) {
  try {
    const cart = await DonationCart.findOne({
      where: { donor_user_id: req.user.id },
      include: [{ model: DonationCartItem, as: 'items' }]
    });

    const latestOrder = await DonationOrder.findOne({
      where: { donor_user_id: req.user.id },
      order: [['created_at', 'DESC']],
      include: [
        { model: Donation, as: 'donations' },
        { model: PaymentTransaction, as: 'transaction' }
      ]
    });

    return res.status(200).json({
      message: 'Donation debug summary',
      cart,
      latest_order: latestOrder,
      donation_count_for_user: latestOrder?.donations?.length || 0
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to build donation test summary', error: error.message });
  }
}

module.exports = {
  getDonationsByUser,
  getDonationsByNeed,
  testSummary
};
