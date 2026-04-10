// DeliveryProof stores final delivery proof artifacts and geo evidence.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DeliveryProof = sequelize.define(
  'DeliveryProof',
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
    photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    signature_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    otp_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    gps_lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    gps_lng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    }
  },
  {
    tableName: 'delivery_proofs',
    underscored: true,
    timestamps: true,
    updatedAt: false
  }
);

module.exports = DeliveryProof;
