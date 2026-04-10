// DeliveryOffer stores each courier response to a pending delivery request.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DeliveryOffer = sequelize.define(
  'DeliveryOffer',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    request_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    courier_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    offered_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    note: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'withdrawn'),
      allowNull: false,
      defaultValue: 'pending'
    }
  },
  {
    tableName: 'delivery_offers',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['request_id', 'courier_user_id']
      }
    ]
  }
);

module.exports = DeliveryOffer;