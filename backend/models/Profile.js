// Profile model stores role-specific profile details and trust score per user.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Profile = sequelize.define(
  'Profile',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true
    },
    address_line: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    governorate: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Tunisia'
    },
    trust_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    role_metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    tableName: 'profiles',
    underscored: true,
    timestamps: true
  }
);

module.exports = Profile;
