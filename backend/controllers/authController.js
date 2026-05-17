const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { hashPassword, comparePassword, assignRole, detectRole } = require('./userController');

function buildToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role || 'donator'
    },
    process.env.JWT_SECRET || 'amena-dev-secret',
    { expiresIn: '1d' }
  );
}

async function register(req, res) {
  try {
    const { name, email, password, phone, role: requestedRole } = req.body;
    const role = requestedRole || 'donator';
    const allowedRoles = ['donator', 'organization', 'delivery_person'];

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    if (role === 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin registration is not allowed' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const user = await User.create({ name, email, password: await hashPassword(password), phone });
    await assignRole(user.user_id, role, req.body);

    return res.status(201).json({
      message: 'User registered successfully',
      token: buildToken({ ...user.get({ plain: true }), role }),
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const role = (await detectRole(user.user_id)) || 'donator';

    return res.status(200).json({
      message: 'Login successful',
      token: buildToken({ ...user.get({ plain: true }), role }),
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

async function logout(req, res) {
  return res.status(200).json({ message: 'Logout successful' });
}

module.exports = {
  register,
  login,
  logout
};