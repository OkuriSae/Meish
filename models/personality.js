'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Personality = loader.database.define('personalities', {
  userId: {
    type: Sequelize.BIGINT(20),
    primaryKey: true,
    allowNull: false
  },
  icon: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nameJa: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nameEn: {
    type: Sequelize.STRING,
    allowNull: true
  },
  label: {
    type: Sequelize.STRING,
    allowNull: true
  },
  introduction: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  tachie: {
    type: Sequelize.STRING,
    allowNull: false
  },
  design_path: {
    type: Sequelize.STRING,
    allowNull: true
  },
  design_comment: {
    type: Sequelize.STRING,
    allowNull: true
  },
  logo_path: {
    type: Sequelize.STRING,
    allowNull: true
  },
  deleted: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
    freezeTableName: true,
    indexes: [
      {
        fields: ['createdAt']
      }
    ]
  });

module.exports = Personality;
