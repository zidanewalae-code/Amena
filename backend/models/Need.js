// Need model stores funding requests created by organizations or beneficiaries.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Need = sequelize.define(
  'Need',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    organization_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    beneficiary_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(220),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('food', 'medical', 'education', 'housing', 'emergency', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    urgency_level: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    },
    amount_target: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    amount_collected: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('draft', 'under_review', 'published', 'partially_funded', 'funded', 'closed', 'rejected'),
      allowNull: false,
      defaultValue: 'draft'
    },
    created_by_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    }
  },
  {
    tableName: 'needs',
    underscored: true,
    timestamps: true
  }
);

module.exports = Need;
