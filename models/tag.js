'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Tag = loader.database.define('tag', {
  userId: {
    type: Sequelize.BIGINT(20),
    primaryKey: true,
    allowNull: false
  },
  tagname: {
    type: Sequelize.STRING,
    primaryKey: true,
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

module.exports = Tag;
