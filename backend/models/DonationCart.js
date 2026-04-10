// DonationCart stores one current donation cart per donor user.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DonationCart = sequelize.define(
  'DonationCart',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    donor_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('active', 'checked_out'),
      allowNull: false,
      defaultValue: 'active'
    }
  },
  {
    tableName: 'donation_carts',
    underscored: true,
    timestamps: true
  }
);

module.exports = DonationCart;
