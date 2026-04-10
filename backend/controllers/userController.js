// Handles user and profile CRUD, role changes, and trust score management.
const { User, Profile } = require('../models');

function sanitizeUser(user, profile) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    is_active: user.is_active,
    created_at: user.created_at,
    profile: profile
      ? {
          id: profile.id,
          address_line: profile.address_line,
          city: profile.city,
          governorate: profile.governorate,
          country: profile.country,
          trust_score: profile.trust_score,
          role_metadata: profile.role_metadata
        }
      : null
  };
}

async function getAllUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'full_name', 'email', 'role', 'phone', 'is_active', 'created_at'],
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'address_line', 'city', 'governorate', 'country', 'trust_score', 'role_metadata']
        }
      ]
    });

    return res.status(200).json(users.map((entry) => sanitizeUser(entry, entry.profile)));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
}

async function getUserById(req, res) {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'full_name', 'email', 'role', 'phone', 'is_active', 'created_at'],
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['id', 'address_line', 'city', 'governorate', 'country', 'trust_score', 'role_metadata']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(sanitizeUser(user, user.profile));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const { full_name, phone, is_active } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSelf = req.user.id === user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: you can only update your own account' });
    }

    if (full_name !== undefined) user.full_name = full_name;
    if (phone !== undefined) user.phone = phone;
    if (is_active !== undefined && isAdmin) user.is_active = Boolean(is_active);

    await user.save();

    const profile = await Profile.findOne({ where: { user_id: user.id } });

    return res.status(200).json({
      message: 'User updated',
      user: sanitizeUser(user, profile)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
}

async function createOrUpdateProfile(req, res) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSelf = req.user.id === user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: you can only edit your own profile' });
    }

    const payload = {
      address_line: req.body.address_line,
      city: req.body.city,
      governorate: req.body.governorate,
      country: req.body.country,
      role_metadata: req.body.role_metadata
    };

    let profile = await Profile.findOne({ where: { user_id: user.id } });
    if (!profile) {
      profile = await Profile.create({ user_id: user.id, ...payload });
    } else {
      Object.keys(payload).forEach((key) => {
        if (payload[key] !== undefined) profile[key] = payload[key];
      });
      await profile.save();
    }

    return res.status(200).json({ message: 'Profile saved', profile });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save profile', error: error.message });
  }
}

async function updateUserRole(req, res) {
  try {
    const { role } = req.body;
    const allowedRoles = ['donor', 'organization', 'beneficiary', 'company', 'courier', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({ message: 'Role updated', user: sanitizeUser(user, await Profile.findOne({ where: { user_id: user.id } })) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update role', error: error.message });
  }
}

async function updateTrustScore(req, res) {
  try {
    const { trust_score } = req.body;
    const numericScore = Number(trust_score);

    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return res.status(400).json({ message: 'trust_score must be a number between 0 and 100' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = await Profile.findOne({ where: { user_id: user.id } });
    if (!profile) {
      profile = await Profile.create({ user_id: user.id, trust_score: numericScore });
    } else {
      profile.trust_score = numericScore;
      await profile.save();
    }

    return res.status(200).json({ message: 'Trust score updated', profile });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update trust score', error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();

    return res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  createOrUpdateProfile,
  updateUserRole,
  updateTrustScore,
  deleteUser
};
