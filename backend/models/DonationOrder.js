// DonationOrder stores finalized checkout snapshots and high-level order status.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DonationOrder = sequelize.define(
  'DonationOrder',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    donor_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    cart_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    order_reference: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: 'TND'
    },
    status: {
      type: DataTypes.ENUM('pending', 'partially_paid', 'paid', 'failed', 'completed', 'refunded', 'canceled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_webhook_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'donation_orders',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['donor_user_id', 'created_at']
      },
      {
        fields: ['status', 'created_at']
      },
      {
        fields: ['donor_user_id', 'status', 'created_at']
      },
      {
        fields: ['currency', 'created_at']
      },
      {
        fields: ['total_amount', 'created_at']
      },
      {
        fields: ['last_webhook_at']
      }
    ]
  }
);

module.exports = DonationOrder;
