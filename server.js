require('dotenv').config();

const express = require('express');
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes');
const { authenticate, isAdmin } = require('./middleware/auth');
const { getProfile, getAdmin } = require('./controllers/authController');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

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
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: err.errors[0].message });
  }

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

startServer();
