'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const User = loader.database.define('users', {
  userId: {
    type: Sequelize.BIGINT(20),
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  visibility: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  deleted: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
    freezeTableName: true
});

module.exports = User;