// Immutable audit trail for payment lifecycle events.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PaymentAuditLog = sequelize.define(
  'PaymentAuditLog',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    payment_transaction_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    donation_order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    event_type: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    provider_name: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    status_before: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    status_after: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    trace_id: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    previous_hash: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    payload_hash: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    chain_hash: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    tableName: 'payment_audit_logs',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['payment_transaction_id', 'created_at'] },
      { fields: ['trace_id'] },
      { unique: true, fields: ['chain_hash'] }
    ]
  }
);

module.exports = PaymentAuditLog;
