// Structured trust/fraud report for marketplace items.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MarketplaceReport = sequelize.define(
  'MarketplaceReport',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    item_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    reporter_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('open', 'reviewing', 'resolved', 'dismissed'),
      allowNull: false,
      defaultValue: 'open'
    }
  },
  {
    tableName: 'marketplace_reports',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['item_id', 'created_at'] }, { fields: ['reporter_user_id', 'created_at'] }, { fields: ['status'] }]
  }
);

module.exports = MarketplaceReport;
