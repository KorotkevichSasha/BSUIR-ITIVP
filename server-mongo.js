require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectMongo, mongoose } = require('./mongodb/db');
const { router: authRouter } = require('./mongodb/auth');
const { router: postsRouter } = require('./mongodb/routes');
const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://127.0.0.1:4173'],
  allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '32kb' }));
app.use('/media', express.static(path.join(__dirname, 'public/media')));
app.get('/', (req, res) => res.json({ message: 'Game Media MongoDB API', storage: 'MongoDB', lab: 6 }));
app.use('/auth', authRouter);
app.use('/posts', postsRouter);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, req, res, next) => {
  if (error.code === 11000) return res.status(409).json({ error: 'Email is already registered' });
  if (['ValidationError', 'CastError', 'StrictModeError'].includes(error.name)) return res.status(400).json({ error: 'Invalid document fields or values' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'JSON body is too large' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  console.error('MongoDB API error:', error.name);
  return res.status(503).json({ error: 'Database is unavailable. Retry later.' });
});
async function startServer() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  await connectMongo();
  await Promise.all([require('./mongodb/models/User').createIndexes(), require('./mongodb/models/Post').createIndexes()]);
  const server = app.listen(Number(process.env.MONGO_PORT) || 3002, '127.0.0.1', () => console.log('MongoDB API: http://localhost:' + (process.env.MONGO_PORT || 3002)));
  async function close() { server.close(); await mongoose.disconnect(); }
  process.once('SIGINT', close); process.once('SIGTERM', close);
  return server;
}
if (require.main === module) startServer().catch(error => { console.error('MongoDB startup failed:', error.name, error.message.includes('MONGO_URI') ? 'Set MONGO_URI in .env' : 'Check Atlas connection, database user and IP access'); process.exitCode = 1; mongoose.disconnect(); });
module.exports = { app, startServer };
