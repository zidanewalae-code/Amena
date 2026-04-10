// SocialDonation represents a direct monetary donation made by a donor user.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SocialDonation = sequelize.define(
  'SocialDonation',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
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
    tableName: 'social_donations',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['user_id', 'created_at'] }, { fields: ['status', 'created_at'] }]
  }
);

module.exports = SocialDonation;
