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
  subprofile: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  ogp_path: {
    type: Sequelize.STRING,
    allowNull: true,
    get() {
      const relativePath = this.getDataValue('ogp_path');
      return relativePath ? process.env.s3Path + relativePath : "";
    }
  },
  thumbnail_path: {
    type: Sequelize.STRING,
    allowNull: true,
    get() {
      const relativePath = this.getDataValue('thumbnail_path');
      return relativePath ? process.env.s3Path + relativePath : "";
    }
  },
  tachie: {
    type: Sequelize.STRING,
    allowNull: true,
    get() {
      const relativePath = this.getDataValue('tachie');
      return relativePath ? process.env.s3Path + relativePath : "";
    }
  },
  back_path: {
    type: Sequelize.STRING,
    allowNull: true,
    get() {
      const relativePath = this.getDataValue('back_path');
      return relativePath ? process.env.s3Path + relativePath : "";
    }
  },
  design_path: {
    type: Sequelize.STRING,
    allowNull: true,
    get() {
      const relativePath = this.getDataValue('design_path');
      return relativePath ? process.env.s3Path + relativePath : "";
    }
  },
  design_comment: {
    type: Sequelize.STRING,
    allowNull: true
  },
  logo_path: {
    type: Sequelize.STRING,
    allowNull: true,
    get() {
      const relativePath = this.getDataValue('logo_path');
      return relativePath ? process.env.s3Path + relativePath : "";
    } 
  },
  movie_id: {
    type: Sequelize.STRING,
    allowNull: true
  },
  isSensitive: {
    type: Sequelize.STRING,
    allowNull: true
  },
  penaltyState: {
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
