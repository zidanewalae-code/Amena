// CourierProfile stores logistics attributes and performance counters for couriers.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CourierProfile = sequelize.define(
  'CourierProfile',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true
    },
    courier_type: {
      type: DataTypes.ENUM('volunteer', 'partner'),
      allowNull: false,
      defaultValue: 'volunteer'
    },
    vehicle_type: {
      type: DataTypes.ENUM('foot', 'bike', 'motorbike', 'car', 'van'),
      allowNull: false,
      defaultValue: 'motorbike'
    },
    service_zone: {
      type: DataTypes.STRING(180),
      allowNull: true
    },
    verification_status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected', 'suspended'),
      allowNull: false,
      defaultValue: 'pending'
    },
    trust_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_missions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    successful_missions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: 'courier_profiles',
    underscored: true,
    timestamps: true
  }
);

module.exports = CourierProfile;
