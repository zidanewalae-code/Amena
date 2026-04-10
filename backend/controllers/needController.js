// Handles CRUD and lifecycle operations for needs and need updates.
const { Op } = require('sequelize');
const { Need, NeedUpdate, User, Organization, Beneficiary } = require('../models');

const allowedNeedCreators = ['organization', 'beneficiary', 'admin'];
const allowedStatuses = ['draft', 'under_review', 'published', 'partially_funded', 'funded', 'closed', 'rejected'];

function parsePagination(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function computeScores(need) {
  const amountCollected = Number(need.amount_collected || 0);
  const amountTarget = Number(need.amount_target || 0);
  const updatesCount = Array.isArray(need.updates) ? need.updates.length : 0;
  const progressPercent = amountTarget > 0 ? Math.min(Math.round((amountCollected / amountTarget) * 100), 100) : 0;

  const urgencyWeight = {
    low: 20,
    medium: 45,
    high: 70,
    critical: 90
  };

  const remainingRatio = amountTarget > 0 ? Math.max(0, (amountTarget - amountCollected) / amountTarget) : 0;
  const transparencyBase = 35;
  const transparencyUpdates = Math.min(updatesCount * 8, 35);
  const transparencyStatus = ['published', 'partially_funded', 'funded'].includes(need.status) ? 20 : 10;
  const transparencyScore = Math.min(100, transparencyBase + transparencyUpdates + transparencyStatus);

  const priorityScore = Math.min(100, Math.round((urgencyWeight[need.urgency_level] || 40) * 0.7 + remainingRatio * 30));

  return {
    amount_remaining: Math.max(amountTarget - amountCollected, 0),
    progress_percent: progressPercent,
    transparency_score: transparencyScore,
    priority_score: priorityScore,
    updates_count: updatesCount
  };
}

async function listNeeds(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = {};

    if (req.query.status) {
      where.status = req.query.status;
    } else {
      where.status = 'published';
    }

    if (req.query.category) where.category = req.query.category;
    if (req.query.urgency_level) where.urgency_level = req.query.urgency_level;
    if (req.query.creator_user_id) where.created_by_user_id = Number(req.query.creator_user_id);

    if (req.query.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${req.query.search}%` } },
        { description: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    if (req.query.location) {
      const locationLike = `%${req.query.location}%`;
      where[Op.and] = [
        ...(Array.isArray(where[Op.and]) ? where[Op.and] : []),
        {
          [Op.or]: [
            { title: { [Op.like]: locationLike } },
            { description: { [Op.like]: locationLike } }
          ]
        }
      ];
    }

    const order = [['created_at', 'DESC']];
    if (req.query.sort_by === 'urgency') order.unshift(['urgency_level', 'DESC']);

    const { count, rows } = await Need.findAndCountAll({
      where,
      order,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'role'] },
        { model: NeedUpdate, as: 'updates', attributes: ['id', 'update_text', 'photo_url', 'document_url', 'created_at'] }
      ],
      limit,
      offset,
      distinct: true
    });

    let items = rows.map((need) => ({
      ...need.toJSON(),
      ...computeScores(need)
    }));

    if (req.query.sort_by === 'priority') {
      items = items.sort((a, b) => b.priority_score - a.priority_score);
    }

    return res.status(200).json({
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
      items
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list needs', error: error.message });
  }
}

async function getNeedById(req, res) {
  try {
    const need = await Need.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'role'] },
        { model: NeedUpdate, as: 'updates', attributes: ['id', 'update_text', 'photo_url', 'document_url', 'created_at'] }
      ]
    });

    if (!need) {
      return res.status(404).json({ message: 'Need not found' });
    }

    const amountCollected = Number(need.amount_collected);
    const amountTarget = Number(need.amount_target);
    const scores = computeScores(need);

    return res.status(200).json({
      ...need.toJSON(),
      ...scores
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get need', error: error.message });
  }
}

async function listRecommendedNeeds(req, res) {
  try {
    const where = { status: { [Op.in]: ['published', 'partially_funded'] } };
    if (req.query.category) where.category = req.query.category;

    const needs = await Need.findAll({
      where,
      include: [{ model: NeedUpdate, as: 'updates', attributes: ['id'] }],
      limit: 50,
      order: [['created_at', 'DESC']]
    });

    const recommended = needs
      .map((need) => ({
        ...need.toJSON(),
        ...computeScores(need)
      }))
      .sort((a, b) => b.priority_score - a.priority_score || b.transparency_score - a.transparency_score)
      .slice(0, 12);

    return res.status(200).json({ items: recommended });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to build recommendations', error: error.message });
  }
}

async function createNeed(req, res) {
  try {
    const { role, id: userId } = req.user;

    if (!allowedNeedCreators.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: role cannot create needs' });
    }

    const {
      title,
      description,
      category,
      urgency_level,
      amount_target,
      status,
      organization_id,
      beneficiary_id
    } = req.body;

    const payload = {
      title,
      description,
      category,
      urgency_level,
      amount_target,
      status: status || 'draft',
      created_by_user_id: userId
    };

    if (role === 'organization') {
      const org = await Organization.findOne({ where: { user_id: userId } });
      if (!org) {
        return res.status(400).json({ message: 'Organization profile is required' });
      }
      payload.organization_id = org.id;
    } else if (role === 'beneficiary') {
      const beneficiary = await Beneficiary.findOne({ where: { user_id: userId } });
      if (!beneficiary) {
        return res.status(400).json({ message: 'Beneficiary profile is required' });
      }
      payload.beneficiary_id = beneficiary.id;
    } else {
      if (organization_id) payload.organization_id = organization_id;
      if (beneficiary_id) payload.beneficiary_id = beneficiary_id;
    }

    const need = await Need.create(payload);

    return res.status(201).json({ message: 'Need created', need });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create need', error: error.message });
  }
}

async function updateNeed(req, res) {
  try {
    const need = await Need.findByPk(req.params.id);
    if (!need) {
      return res.status(404).json({ message: 'Need not found' });
    }

    const isOwner = need.created_by_user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: only owner or admin can update this need' });
    }

    const editableFields = ['title', 'description', 'category', 'urgency_level', 'amount_target', 'amount_collected'];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        need[field] = req.body[field];
      }
    });

    if (Number(need.amount_collected) > Number(need.amount_target)) {
      return res.status(400).json({ message: 'amount_collected cannot exceed amount_target' });
    }

    await need.save();

    return res.status(200).json({ message: 'Need updated', need });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update need', error: error.message });
  }
}

async function updateNeedStatus(req, res) {
  try {
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid need status' });
    }

    const need = await Need.findByPk(req.params.id);
    if (!need) {
      return res.status(404).json({ message: 'Need not found' });
    }

    const isOwner = need.created_by_user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: only owner or admin can change status' });
    }

    need.status = status;
    await need.save();

    return res.status(200).json({ message: 'Need status updated', need });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update need status', error: error.message });
  }
}

async function addNeedUpdate(req, res) {
  try {
    const need = await Need.findByPk(req.params.id);
    if (!need) {
      return res.status(404).json({ message: 'Need not found' });
    }

    const isOwner = need.created_by_user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: only owner or admin can add updates' });
    }

    const { update_text, photo_url, document_url } = req.body;

    const needUpdate = await NeedUpdate.create({
      need_id: need.id,
      update_text,
      photo_url,
      document_url,
      created_by_user_id: req.user.id
    });

    return res.status(201).json({ message: 'Need update added', needUpdate });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add need update', error: error.message });
  }
}

async function deleteNeed(req, res) {
  try {
    const need = await Need.findByPk(req.params.id);
    if (!need) {
      return res.status(404).json({ message: 'Need not found' });
    }

    const isOwner = need.created_by_user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: only owner or admin can delete this need' });
    }

    await need.destroy();

    return res.status(200).json({ message: 'Need deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete need', error: error.message });
  }
}

module.exports = {
  listNeeds,
  getNeedById,
  createNeed,
  updateNeed,
  updateNeedStatus,
  addNeedUpdate,
  deleteNeed,
  listRecommendedNeeds
};
