// SocialProduct is a catalog item that can be purchased in social orders.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SocialProduct = sequelize.define(
  'SocialProduct',
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: 'social_products',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['name'] }, { fields: ['stock'] }]
  }
);

module.exports = SocialProduct;
