'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Tachie = loader.database.define('tachies', {
  userId: {
    type: Sequelize.BIGINT(20),
    primaryKey: true,
    allowNull: false
  },
  tachieId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  comment: {
    type: Sequelize.STRING,
    allowNull: true
  },
  path: {
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

module.exports = Tachie;
