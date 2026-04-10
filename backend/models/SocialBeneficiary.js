// SocialBeneficiary represents a recipient profile for aid assignments.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SocialBeneficiary = sequelize.define(
  'SocialBeneficiary',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    need: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'social_beneficiaries',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['name'] }]
  }
);

module.exports = SocialBeneficiary;
