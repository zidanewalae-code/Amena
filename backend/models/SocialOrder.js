// SocialOrder stores a purchase transaction started by a donor.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SocialOrder = sequelize.define(
  'SocialOrder',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'validated', 'canceled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    }
  },
  {
    tableName: 'social_orders',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['user_id', 'created_at'] }, { fields: ['status', 'created_at'] }]
  }
);

module.exports = SocialOrder;
