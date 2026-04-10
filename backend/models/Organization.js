// Organization model stores verification and legal details for associations.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Organization = sequelize.define(
  'Organization',
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
    legal_name: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    registration_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    verified_status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected', 'suspended'),
      allowNull: false,
      defaultValue: 'pending'
    }
  },
  {
    tableName: 'organizations',
    underscored: true,
    timestamps: true
  }
);

module.exports = Organization;
