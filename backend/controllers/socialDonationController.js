// Controller for donor donations and admin validation/cancellation.
const { Op } = require('sequelize');
const { SocialDonation, SocialAssignment, SocialBeneficiary } = require('../models');

function parsePagination(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildDonationWhere(query, userId) {
  const where = {};
  if (userId) where.user_id = userId;
  if (query.status) where.status = String(query.status).toLowerCase();
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date[Op.gte] = new Date(query.from);
    if (query.to) where.date[Op.lte] = new Date(query.to);
  }
  return where;
}

async function createDonation(req, res) {
  try {
    const donation = await SocialDonation.create({
      amount: req.body.amount,
      status: 'pending',
      user_id: req.user.id,
      date: new Date()
    });

    return res.status(201).json({ message: 'Donation created', donation });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create donation', error: error.message });
  }
}

async function listMyDonations(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = buildDonationWhere(req.query, req.user.id);

    const { count, rows } = await SocialDonation.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      include: [{ model: SocialAssignment, as: 'assignments', include: [{ model: SocialBeneficiary, as: 'beneficiary' }] }],
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
    return res.status(500).json({ message: 'Failed to list donations', error: error.message });
  }
}

async function adminListDonations(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = buildDonationWhere(req.query);

    const { count, rows } = await SocialDonation.findAndCountAll({
      where,
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
    return res.status(500).json({ message: 'Failed to list donations', error: error.message });
  }
}

async function getDonationById(req, res) {
  try {
    const donation = await SocialDonation.findByPk(req.params.id, {
      include: [{ model: SocialAssignment, as: 'assignments', include: [{ model: SocialBeneficiary, as: 'beneficiary' }] }]
    });
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    const isOwner = Number(donation.user_id) === Number(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    return res.status(200).json(donation);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch donation', error: error.message });
  }
}

async function setDonationStatus(req, res) {
  try {
    const donation = await SocialDonation.findByPk(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    donation.status = req.body.status;
    await donation.save();
    return res.status(200).json({ message: 'Donation status updated', donation });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update donation status', error: error.message });
  }
}

async function deleteDonation(req, res) {
  try {
    const donation = await SocialDonation.findByPk(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    await donation.destroy();
    return res.status(200).json({ message: 'Donation deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete donation', error: error.message });
  }
}

module.exports = {
  createDonation,
  listMyDonations,
  adminListDonations,
  getDonationById,
  setDonationStatus,
  deleteDonation
};
