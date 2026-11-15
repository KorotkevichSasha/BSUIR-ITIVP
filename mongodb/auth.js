const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { mongoose } = require('./db');
const issuer = 'game-media-mongodb';
const router = express.Router();

function credentials(body) {
  return body && typeof body.email === 'string' && body.email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
    && typeof body.password === 'string' && body.password.trim().length > 0
    && Buffer.byteLength(body.password, 'utf8') <= 72;
}

router.post('/register', async (req, res) => {
  if (!credentials(req.body)) return res.status(400).json({ error: 'Enter a valid email and a password of 1–72 UTF-8 bytes' });
  const email = req.body.email.trim().toLowerCase();
  const user = await User.create({ email, passwordHash: await bcrypt.hash(req.body.password, 10) });
  return res.status(201).json({ id: user.id, email: user.email, role: user.role });
});

router.post('/login', async (req, res) => {
  if (!credentials(req.body)) return res.status(400).json({ error: 'Invalid credentials format' });
  const user = await User.findOne({ email: req.body.email.trim().toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { algorithm: 'HS256', issuer, expiresIn: '1h' });
  return res.json({ token });
});

async function authenticate(req, res, next) {
  const match = req.get('Authorization')?.match(/^Bearer (\S+)$/i);
  if (!match) return res.status(401).json({ error: 'Bearer token is required' });
  let payload;
  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'], issuer });
    if (!mongoose.isObjectIdOrHexString(payload.id)) throw new Error('Invalid id');
  } catch { return res.status(401).json({ error: 'Invalid or expired MongoDB token' }); }
  const user = await User.findById(payload.id);
  if (!user) return res.status(401).json({ error: 'User not found' });
  req.user = { id: user.id, email: user.email };
  return next();
}
module.exports = { router, authenticate };
