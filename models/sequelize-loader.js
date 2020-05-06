'use strict';
if (process.env.DATABASE_URL) {
  var pg = require('pg');
  pg.defaults.ssl = true;
}

const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost/meishdev',
  {
    operatorsAliases: false,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};
