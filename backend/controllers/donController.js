const { sequelize, Don, Product, Donator, Category } = require('../models');

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function loadDon(donId) {
  return Don.findByPk(donId, {
    include: [
      { model: Donator, as: 'donator' },
      { model: Product, as: 'products', include: [{ model: Category, as: 'category' }] }
    ]
  });
}

function canSeeDonations(user, don) {
  if (user.role === 'admin' || user.role === 'organization') {
    return true;
  }

  return user.role === 'donator' && Number(don?.donor_id) === Number(user.user_id);
}

async function getAllDons(req, res) {
  try {
    const include = [
      { model: Donator, as: 'donator' },
      { model: Product, as: 'products', include: [{ model: Category, as: 'category' }] }
    ];

    let dons = [];
    if (req.user.role === 'admin' || req.user.role === 'organization') {
      dons = await Don.findAll({ order: [['don_id', 'DESC']], include });
    } else if (req.user.role === 'donator') {
      dons = await Don.findAll({
        order: [['don_id', 'DESC']],
        where: { donor_id: req.user.user_id },
        include
      });
    } else {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    return res.status(200).json(dons);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch dons', error: error.message });
  }
}

async function getDonById(req, res) {
  try {
    const don = await loadDon(req.params.id);
    if (!don) {
      return res.status(404).json({ message: 'Don not found' });
    }

    if (!canSeeDonations(req.user, don)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    return res.status(200).json(don);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch don', error: error.message });
  }
}

async function createDon(req, res) {
  try {
    if (!['admin', 'organization', 'donator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const { donor_id, date, status, product_ids = [] } = req.body;
    const ownerDonorId = req.user.role === 'donator' ? req.user.user_id : donor_id;

    if (!ownerDonorId) {
      return res.status(400).json({ message: 'donor_id is required' });
    }

    const don = await sequelize.transaction(async (transaction) => {
      const created = await Don.create(
        {
          donor_id: ownerDonorId,
          date: date || today(),
          status: status || 'pending'
        },
        { transaction }
      );

      if (Array.isArray(product_ids) && product_ids.length > 0) {
        await created.addProducts(product_ids, { transaction });
      }

      return created;
    });

    return res.status(201).json(await loadDon(don.don_id));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create don', error: error.message });
  }
}

async function updateDon(req, res) {
  try {
    const don = await Don.findByPk(req.params.id);
    if (!don) {
      return res.status(404).json({ message: 'Don not found' });
    }

    const loadedDon = await loadDon(don.don_id);
    if (!canSeeDonations(req.user, loadedDon)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    if (!['admin', 'organization', 'donator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const { date, status, donor_id, product_ids } = req.body;
    if (date !== undefined) don.date = date;
    if (status !== undefined) don.status = status;
    if (req.user.role !== 'donator' && donor_id !== undefined) don.donor_id = donor_id;

    await sequelize.transaction(async (transaction) => {
      await don.save({ transaction });
      if (Array.isArray(product_ids)) {
        await don.setProducts(product_ids, { transaction });
      }
    });

    return res.status(200).json(await loadDon(don.don_id));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update don', error: error.message });
  }
}

async function deleteDon(req, res) {
  try {
    const don = await Don.findByPk(req.params.id);
    if (!don) {
      return res.status(404).json({ message: 'Don not found' });
    }

    const loadedDon = await loadDon(don.don_id);
    if (!canSeeDonations(req.user, loadedDon)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    if (!['admin', 'organization', 'donator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    await don.destroy();
    return res.status(200).json({ message: 'Don deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete don', error: error.message });
  }
}

module.exports = {
  getAllDons,
  getDonById,
  createDon,
  updateDon,
  deleteDon
};