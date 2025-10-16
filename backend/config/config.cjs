require('dotenv').config();

const base = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: false,
  dialectOptions: {} // sin SSL para DB interna de Render
};

module.exports = { development: base, test: base, production: base };
