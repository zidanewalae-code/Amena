// Donation stores finalized contribution lines linked to an order and a need.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Donation = sequelize.define(
  'Donation',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    donor_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    need_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    }
  },
  {
    tableName: 'donations',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['order_id', 'need_id']
      },
      {
        fields: ['order_id', 'status']
      },
      {
        fields: ['need_id', 'created_at']
      },
      {
        fields: ['donor_user_id', 'created_at']
      }
    ]
  }
);

module.exports = Donation;
