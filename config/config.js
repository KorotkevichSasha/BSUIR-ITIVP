require('dotenv').config();

const databaseConfig = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  dialectOptions: {
    connectionTimeoutMillis: 5000,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: { max: 5, min: 0, acquire: 7000, idle: 10000 },
  logging: false,
};

module.exports = {
  development: databaseConfig,
  test: databaseConfig,
  production: databaseConfig,
};
