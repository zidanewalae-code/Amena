// PaymentTransaction stores provider-level payment tracking for one donation order.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PaymentTransaction = sequelize.define(
  'PaymentTransaction',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    donation_order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true
    },
    provider_name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'mock_stripe'
    },
    transaction_id: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    idempotency_key: {
      type: DataTypes.STRING(120),
      allowNull: true,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'partially_paid', 'paid', 'failed', 'refunded', 'canceled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: 'TND'
    },
    raw_payload: {
      type: DataTypes.JSON,
      allowNull: true
    },
    incident_flag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    incident_note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    incident_marked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_webhook_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'payment_transactions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['status', 'created_at']
      },
      {
        fields: ['provider_name', 'status', 'created_at']
      },
      {
        fields: ['incident_flag', 'created_at']
      },
      {
        fields: ['currency', 'created_at']
      },
      {
        fields: ['last_webhook_at']
      },
      {
        fields: ['transaction_id']
      }
    ]
  }
);

module.exports = PaymentTransaction;
