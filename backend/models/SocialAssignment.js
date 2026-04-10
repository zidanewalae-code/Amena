// SocialAssignment links either a donation or an order to one beneficiary.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SocialAssignment = sequelize.define(
  'SocialAssignment',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('donation', 'order'),
      allowNull: false
    },
    donation_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    beneficiary_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    }
  },
  {
    tableName: 'social_assignments',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['beneficiary_id', 'created_at'] },
      { fields: ['donation_id'] },
      { fields: ['order_id'] }
    ]
  }
);

module.exports = SocialAssignment;
