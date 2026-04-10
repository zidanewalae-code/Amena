// DonationItem stores each need contribution line inside a cart and optional checked-out order.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DonationItem = sequelize.define(
  'DonationItem',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    cart_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    need_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    }
  },
  {
    tableName: 'donation_items',
    underscored: true,
    timestamps: true
  }
);

module.exports = DonationItem;
