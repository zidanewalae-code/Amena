// DeliveryRequest tracks a negotiable delivery job before and after courier selection.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DeliveryRequest = sequelize.define(
  'DeliveryRequest',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    need_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    donation_order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    requested_by_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    assigned_courier_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    selected_offer_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    pickup_location: {
      type: DataTypes.JSON,
      allowNull: false
    },
    dropoff_location: {
      type: DataTypes.JSON,
      allowNull: false
    },
    proposed_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    accepted_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'in_progress', 'delivered', 'confirmed', 'canceled', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'delivery_requests',
    underscored: true,
    timestamps: true
  }
);

module.exports = DeliveryRequest;