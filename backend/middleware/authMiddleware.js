const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: token missing' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'amena-dev-secret');
    req.user = {
      ...payload,
      id: payload.user_id || payload.id,
      user_id: payload.user_id || payload.id
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: token invalid' });
  }
}

module.exports = authMiddleware;
