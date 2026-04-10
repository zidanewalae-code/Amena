// Marketplace item model for donated/sold clothes and shoes.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MarketplaceItem = sequelize.define(
  'MarketplaceItem',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('clothes', 'shoes', 'accessories', 'other'),
      allowNull: false,
      defaultValue: 'clothes'
    },
    size: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    condition: {
      type: DataTypes.ENUM('new', 'like_new', 'good', 'fair'),
      allowNull: false,
      defaultValue: 'good'
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    is_free: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_donation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    urgent_need: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    association_name: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    trust_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 70
    },
    views_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'reserved', 'delivered', 'archived'),
      allowNull: false,
      defaultValue: 'active'
    },
    seller_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    }
  },
  {
    tableName: 'marketplace_items',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['status', 'created_at'] },
      { fields: ['category', 'size'] },
      { fields: ['urgent_need'] },
      { fields: ['seller_user_id', 'created_at'] }
    ]
  }
);

module.exports = MarketplaceItem;
