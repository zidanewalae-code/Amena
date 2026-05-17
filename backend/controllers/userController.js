const bcrypt = require('bcryptjs');
const { User, Donator, Organization, DeliveryPerson, Admin } = require('../models');

const roleOrder = ['admin', 'delivery_person', 'organization', 'donator'];

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

async function clearRoles(userId) {
  await Promise.all([
    Donator.destroy({ where: { donor_id: userId } }),
    Organization.destroy({ where: { organization_id: userId } }),
    DeliveryPerson.destroy({ where: { delivery_person_id: userId } }),
    Admin.destroy({ where: { admin_id: userId } })
  ]);
}

async function assignRole(userId, role, payload = {}) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await clearRoles(userId);

  if (role === 'donator') {
    await Donator.create({ donor_id: userId, donor_level: payload.donor_level || 'basic' });
  } else if (role === 'organization') {
    await Organization.create({
      organization_id: userId,
      organization_name: payload.organization_name || user.name,
      type: payload.type || 'ngo'
    });
  } else if (role === 'delivery_person') {
    await DeliveryPerson.create({
      delivery_person_id: userId,
      vehicle_type: payload.vehicle_type || 'bike',
      availability: payload.availability !== undefined ? Boolean(payload.availability) : true
    });
  } else if (role === 'admin') {
    await Admin.create({
      admin_id: userId,
      role: payload.admin_role || 'admin'
    });
  } else {
    throw new Error('Invalid role');
  }

  return role;
}

async function detectRole(userId) {
  for (const role of roleOrder) {
    if (role === 'admin' && (await Admin.findByPk(userId))) return 'admin';
    if (role === 'delivery_person' && (await DeliveryPerson.findByPk(userId))) return 'delivery_person';
    if (role === 'organization' && (await Organization.findByPk(userId))) return 'organization';
    if (role === 'donator' && (await Donator.findByPk(userId))) return 'donator';
  }

  return null;
}

async function formatUser(user) {
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: await detectRole(user.user_id)
  };
}

async function getAllUsers(req, res) {
  try {
    const users = await User.findAll({ order: [['user_id', 'ASC']] });
    const items = [];
    for (const user of users) {
      items.push(await formatUser(user));
    }
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
}

async function getUserById(req, res) {
  try {
    const currentUserId = Number(req.user.user_id);
    const targetUserId = Number(req.params.id);
    if (req.user.role !== 'admin' && currentUserId !== targetUserId) {
      return res.status(403).json({ message: 'Forbidden: owner access only' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(await formatUser(user));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const currentUserId = Number(req.user.user_id);
    const targetUserId = Number(req.params.id);
    if (req.user.role !== 'admin' && currentUserId !== targetUserId) {
      return res.status(403).json({ message: 'Forbidden: owner access only' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.role !== undefined) {
      return res.status(400).json({ message: 'Role cannot be changed through this endpoint' });
    }

    const { name, email, phone, password } = req.body;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (password !== undefined) user.password = await hashPassword(password);

    await user.save();
    return res.status(200).json({ message: 'User updated', user: await formatUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
}

async function updateUserRole(req, res) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { role } = req.body;
    if (!['donator', 'organization', 'delivery_person', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    await assignRole(user.user_id, role, req.body);
    return res.status(200).json({ message: 'Role updated', user: await formatUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update role', error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    const currentUserId = Number(req.user.user_id);
    const targetUserId = Number(req.params.id);
    if (req.user.role !== 'admin' && currentUserId !== targetUserId) {
      return res.status(403).json({ message: 'Forbidden: owner access only' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await clearRoles(user.user_id);
    await user.destroy();
    return res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  assignRole,
  detectRole,
  clearRoles,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser
};