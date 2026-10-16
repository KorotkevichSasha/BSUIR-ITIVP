require('dotenv').config();

const express = require('express');
const path = require('path');
const pageRoutes = require('./routes/pageRoutes');
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errors');
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes');
const { authenticate, isAdmin } = require('./middleware/auth');
const { getProfile, getAdmin } = require('./controllers/authController');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(requestLogger);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', pageRoutes);

app.use('/posts', postRoutes);
app.use('/auth', authRoutes);
app.get('/profile', authenticate, getProfile);
app.get('/admin', authenticate, isAdmin, getAdmin);

app.use(notFound);
app.use(errorHandler);

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

if (require.main === module) {
  startServer();
}

module.exports = app;
