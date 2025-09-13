require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, LoanProduct, LoanApplication, Loan } = require('../models');
const { seedDatabase } = require('../utils/seedData');
const logger = require('../utils/logger');

const resetDatabase = async () => {
  try {
    logger.info('Starting database reset...');
    logger.info(`Connecting to database: ${process.env.DB_NAME} as user: ${process.env.DB_USER} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // Drop all tables in the correct order (respecting foreign key constraints)
    await Loan.drop({ cascade: true, force: true });
    await LoanApplication.drop({ cascade: true, force: true });
    await LoanProduct.drop({ cascade: true, force: true });
    await User.drop({ cascade: true, force: true });
    
    logger.info('All tables dropped successfully');
    
    // Recreate all tables
    await sequelize.sync({ force: true });
    logger.info('All tables recreated successfully');
    
    // Seed the database with initial data
    await seedDatabase();
    logger.info('Database seeded successfully');
    
    logger.info('Database reset completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database reset failed:', error);
    process.exit(1);
  }
};

resetDatabase();