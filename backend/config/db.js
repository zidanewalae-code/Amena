// Creates and exports the Sequelize connection instance for MariaDB/MySQL.
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'AmenaDB',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mariadb',
    logging: false
  }
);

module.exports = sequelize;
