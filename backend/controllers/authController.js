// Handles registration and login flows with simple validation and JWT issuance.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { User, Organization, Beneficiary, Profile } = require('../models');

const allowedRoles = ['donor', 'organization', 'beneficiary', 'company', 'courier', 'admin'];

function buildToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

async function register(req, res) {
  try {
    const { full_name, email, password, role, phone } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ message: 'full_name, email, password and role are required' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ full_name, email, password_hash, role, phone });

    await Profile.create({
      user_id: user.id,
      trust_score: 0,
      role_metadata: {}
    });

    if (role === 'organization') {
      await Organization.create({
        user_id: user.id,
        legal_name: full_name,
        verified_status: 'pending'
      });
    }

    if (role === 'beneficiary') {
      await Beneficiary.create({
        user_id: user.id,
        vulnerability_level: 'medium'
      });
    }

    const token = buildToken(user);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone
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

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = buildToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone
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
