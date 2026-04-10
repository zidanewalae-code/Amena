// Marketplace order item model.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MarketplaceOrderItem = sequelize.define(
  'MarketplaceOrderItem',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    item_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    unit_price: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: 'marketplace_order_items',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['order_id'] }, { fields: ['item_id'] }]
  }
);

module.exports = MarketplaceOrderItem;
