// Creates and exports the Sequelize connection instance for MariaDB/MySQL or SQLite dev mode.
const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = (process.env.DB_DIALECT || (process.env.DB_STORAGE ? 'sqlite' : 'mariadb')).toLowerCase();

const sequelize =
  dialect === 'sqlite'
    ? new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DB_STORAGE || ':memory:',
        logging: false
      })
    : new Sequelize(process.env.DB_NAME || 'AmenaDB', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mariadb',
        logging: false
      });

module.exports = sequelize;
