// Beneficiary model stores sensitive profile fields and vulnerability metadata.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Beneficiary = sequelize.define(
  'Beneficiary',
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
    national_id_hash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    household_size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    vulnerability_level: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    }
  },
  {
    tableName: 'beneficiaries',
    underscored: true,
    timestamps: true
  }
);

module.exports = Beneficiary;
