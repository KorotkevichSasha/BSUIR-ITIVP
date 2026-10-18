require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes');
const { authenticate, isAdmin } = require('./middleware/auth');
const { getProfile, getAdmin } = require('./controllers/authController');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

const origins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173').split(',').map(value => value.trim());
app.use(cors({ origin: origins, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '32kb' }));
app.use('/media', express.static(path.join(__dirname, 'public/media')));

// Необязательная задержка для демонстрации загрузки и оптимистичных операций.
const demoDelay = process.env.NODE_ENV === 'production' ? 0 : Math.min(5000, Math.max(0, Number(process.env.DEMO_DELAY_MS) || 0));
app.use((req, res, next) => demoDelay ? setTimeout(next, demoDelay) : next());

app.get('/', (req, res) => {
  res.json({ message: 'Game Media API is running' });
});

app.use('/posts', postRoutes);
app.use('/auth', authRoutes);
app.get('/profile', authenticate, getProfile);
app.get('/admin', authenticate, isAdmin, getAdmin);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: err.errors[0].message });
  }

  console.error('Internal server error:', err.name);
  return res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required in .env');
    }
    await sequelize.authenticate();
    console.log('Database connection established');

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
}

if (require.main === module) startServer();
module.exports = { app, startServer };
