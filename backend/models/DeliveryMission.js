// DeliveryMission stores the assignment and status lifecycle for aid delivery.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DeliveryMission = sequelize.define(
  'DeliveryMission',
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
    donation_order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    courier_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    pickup_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    dropoff_address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('to_assign', 'assigned', 'in_progress', 'delivered', 'failed', 'disputed', 'canceled'),
      allowNull: false,
      defaultValue: 'to_assign'
    },
    created_by_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    }
  },
  {
    tableName: 'delivery_missions',
    underscored: true,
    timestamps: true
  }
);

module.exports = DeliveryMission;
