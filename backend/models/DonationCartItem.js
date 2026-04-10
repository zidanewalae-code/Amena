// DonationCartItem stores one selected need and amount inside a donor cart.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DonationCartItem = sequelize.define(
  'DonationCartItem',
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
    tableName: 'donation_cart_items',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['cart_id', 'need_id']
      }
    ]
  }
);

module.exports = DonationCartItem;
