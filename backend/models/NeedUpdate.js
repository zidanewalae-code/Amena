// NeedUpdate model stores progress comments and proof links for each need.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const NeedUpdate = sequelize.define(
  'NeedUpdate',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    need_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    update_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    document_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    created_by_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    }
  },
  {
    tableName: 'need_updates',
    underscored: true,
    timestamps: true
  }
);

module.exports = NeedUpdate;
