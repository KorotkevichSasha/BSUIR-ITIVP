const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

function validateCredentials(body) {
  if (
    !body ||
    typeof body.email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
  ) {
    return 'A valid email is required';
  }
  if (
    typeof body.password !== 'string' ||
    body.password.length === 0 ||
    Buffer.byteLength(body.password, 'utf8') > 72
  ) {
    return 'Password must contain between 1 and 72 bytes';
  }
  return null;
}

async function register(req, res, next) {
  try {
    const validationError = validateCredentials(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const email = req.body.email.trim().toLowerCase();
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ email, passwordHash, role: 'user' });
    return res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const validationError = validateCredentials(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  } catch (error) {
    return next(error);
  }
}

function getProfile(req, res) {
  return res.json(req.user);
}

function getAdmin(req, res) {
  return res.json({ message: 'Admin access granted', user: req.user });
}

module.exports = { register, login, getProfile, getAdmin };
