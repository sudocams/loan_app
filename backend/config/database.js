const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'loan_app',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    dialectOptions: {
      authPlugins: {
        mysql_native_password: () => require('mysql2/lib/auth_plugins/mysql_native_password'),
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info(`MySQL Connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    
    // Try to sync database
    try {
      await sequelize.sync({ force: false, alter: false });
      logger.info('Database synchronized');
      return true;
    } catch (syncError) {
      logger.error(`Database sync error: ${syncError.message}`);
      logger.warn('Database connected but sync failed. You may need to run: npm run reset-db');
      return false;
    }
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    logger.warn('App will continue but database operations will fail');
    return false;
  }
};

module.exports = { sequelize, connectDB };