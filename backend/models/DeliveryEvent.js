// DeliveryEvent stores mission timeline events for transparent tracking.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DeliveryEvent = sequelize.define(
  'DeliveryEvent',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    mission_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    event_type: {
      type: DataTypes.ENUM('created', 'assigned', 'picked_up', 'en_route', 'arrived', 'delivered', 'failed', 'disputed', 'canceled'),
      allowNull: false
    },
    event_note: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    actor_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    }
  },
  {
    tableName: 'delivery_events',
    underscored: true,
    timestamps: true,
    updatedAt: false
  }
);

module.exports = DeliveryEvent;
