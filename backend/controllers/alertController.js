const { Alert, Organization } = require('../models');

function isPublicAlert(alert) {
  return String(alert?.priority || '').toLowerCase() === 'public';
}

function canReadAlert(user, alert) {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'organization') {
    return Number(alert?.organization_id) === Number(user.user_id);
  }

  if (user.role === 'donator' || user.role === 'delivery_person') {
    return isPublicAlert(alert);
  }

  return false;
}

async function getAllAlerts(req, res) {
  try {
    const alerts = await Alert.findAll({ order: [['alert_id', 'DESC']], include: [{ model: Organization, as: 'organization' }] });

    if (req.user.role === 'admin') {
      return res.status(200).json(alerts);
    }

    return res.status(200).json(alerts.filter((alert) => canReadAlert(req.user, alert)));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch alerts', error: error.message });
  }
}

async function getAlertById(req, res) {
  try {
    const alert = await Alert.findByPk(req.params.id, { include: [{ model: Organization, as: 'organization' }] });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (!canReadAlert(req.user, alert)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    return res.status(200).json(alert);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch alert', error: error.message });
  }
}

async function createAlert(req, res) {
  try {
    const { title, description, priority } = req.body;
    const organizationId = req.user.role === 'organization' ? req.user.user_id : req.body.organization_id;

    if (!organizationId) return res.status(400).json({ message: 'organization_id is required' });
    return res.status(201).json(await Alert.create({ title, description, priority, organization_id: organizationId }));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create alert', error: error.message });
  }
}

async function updateAlert(req, res) {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (req.user.role === 'organization' && Number(alert.organization_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const { title, description, priority, organization_id } = req.body;
    if (title !== undefined) alert.title = title;
    if (description !== undefined) alert.description = description;
    if (priority !== undefined) alert.priority = priority;

    if (organization_id !== undefined) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: organization_id cannot be reassigned' });
      }

      alert.organization_id = organization_id;
    }

    await alert.save();
    return res.status(200).json(alert);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update alert', error: error.message });
  }
}

async function deleteAlert(req, res) {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    await alert.destroy();
    return res.status(200).json({ message: 'Alert deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete alert', error: error.message });
  }
}

module.exports = { getAllAlerts, getAlertById, createAlert, updateAlert, deleteAlert };