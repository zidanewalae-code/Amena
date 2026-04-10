// SocialOrderItem is a line item linking an order to a product and quantity.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SocialOrderItem = sequelize.define(
  'SocialOrderItem',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    }
  },
  {
    tableName: 'social_order_items',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['order_id', 'product_id'] }, { fields: ['product_id'] }]
  }
);

module.exports = SocialOrderItem;
