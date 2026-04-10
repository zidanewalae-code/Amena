// PaymentWebhookEvent tracks processed webhook events to enforce idempotence.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PaymentWebhookEvent = sequelize.define(
  'PaymentWebhookEvent',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    provider_name: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    event_id: {
      type: DataTypes.STRING(140),
      allowNull: false,
      unique: true
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'payment_webhook_events',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['provider_name', 'processed_at']
      },
      {
        fields: ['processed_at']
      }
    ]
  }
);

module.exports = PaymentWebhookEvent;
