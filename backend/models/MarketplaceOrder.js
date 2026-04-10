// Marketplace order model to track impact purchases timeline.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MarketplaceOrder = sequelize.define(
  'MarketplaceOrder',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    buyer_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    impact_people_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    status: {
      type: DataTypes.ENUM('purchased', 'picked_up', 'delivered_to_association', 'given_to_beneficiary', 'canceled'),
      allowNull: false,
      defaultValue: 'purchased'
    },
    share_code: {
      type: DataTypes.STRING(64),
      allowNull: true
    }
  },
  {
    tableName: 'marketplace_orders',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['buyer_user_id', 'created_at'] },
      { fields: ['status', 'created_at'] }
    ]
  }
);

module.exports = MarketplaceOrder;
