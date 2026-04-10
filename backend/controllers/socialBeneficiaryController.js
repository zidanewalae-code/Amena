// CRUD controller for beneficiary management (admin).
const { SocialBeneficiary } = require('../models');

async function listBeneficiaries(req, res) {
  try {
    const items = await SocialBeneficiary.findAll({ order: [['created_at', 'DESC']] });
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list beneficiaries', error: error.message });
  }
}

async function createBeneficiary(req, res) {
  try {
    const item = await SocialBeneficiary.create(req.body);
    return res.status(201).json({ message: 'Beneficiary created', beneficiary: item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create beneficiary', error: error.message });
  }
}

async function updateBeneficiary(req, res) {
  try {
    const item = await SocialBeneficiary.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Beneficiary not found' });

    ['name', 'need', 'description'].forEach((field) => {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    });

    await item.save();
    return res.status(200).json({ message: 'Beneficiary updated', beneficiary: item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update beneficiary', error: error.message });
  }
}

async function deleteBeneficiary(req, res) {
  try {
    const item = await SocialBeneficiary.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Beneficiary not found' });

    await item.destroy();
    return res.status(200).json({ message: 'Beneficiary deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete beneficiary', error: error.message });
  }
}

module.exports = {
  listBeneficiaries,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary
};
