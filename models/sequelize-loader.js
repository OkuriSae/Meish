'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost/meish',
  {
    operatorsAliases: false,
    logging: false
  });

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};
