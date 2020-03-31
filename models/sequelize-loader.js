'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost/meishdev',
  {
    operatorsAliases: false,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      idle: 20000,
      acquire: 20000
    }
  });

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};
