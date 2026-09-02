// Sequelize-CLI configuration (migrations/seeders) and runtime DB config.
// All values come from environment variables — see .env.example.
// No real credentials live in this file or anywhere else in the repo.
require('dotenv').config();

const path = require('path');

const baseStorage = (env) =>
  process.env.DB_STORAGE || path.resolve(__dirname, '..', '..', `database/${env}.sqlite`);

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: baseStorage('development'),
    logging: false,
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || path.resolve(__dirname, '..', '..', 'database/production.sqlite'),
    // If you move to a client/server database (Postgres/MySQL) in production,
    // set DB_DIALECT and the fields below via environment variables instead
    // of editing this file.
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false,
  },
};
