'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Cheering = loader.database.define('cheerings', {
  userId: {
    type: Sequelize.BIGINT(20),
    primaryKey: true,
    allowNull: false
  },
  cheeringId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  link: {
    type: Sequelize.STRING,
    allowNull: false
  },
  deleted: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
    freezeTableName: true
  });

module.exports = Cheering;
