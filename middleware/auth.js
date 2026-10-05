const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const match = typeof header === 'string' && header.match(/^Bearer (\S+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Bearer token is required' });
  }

  let payload;
  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!Number.isInteger(payload.id) || payload.id <= 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await User.findByPk(payload.id, { attributes: ['id', 'email', 'role'] });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

module.exports = { authenticate, isAdmin };
