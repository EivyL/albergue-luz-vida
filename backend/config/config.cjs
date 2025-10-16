require('dotenv').config();

const base = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: false,
  dialectOptions: {} // sin SSL para DB interna de Render
};

module.exports = {
  development: { use_env_variable: 'DATABASE_URL', dialect: 'postgres', dialectOptions: {}, logging: false },
  test:        { use_env_variable: 'DATABASE_URL', dialect: 'postgres', dialectOptions: {}, logging: false },
  production:  { use_env_variable: 'DATABASE_URL', dialect: 'postgres', dialectOptions: {}, logging: false },
};
