require('dotenv').config();
const { connectDB } = require('../config/database');
const { User } = require('../models');
const logger = require('../utils/logger');

const createAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@loanapp.com' } });
    if (existingAdmin) {
      logger.info('Admin user already exists');
      console.log('Admin email:', existingAdmin.email);
      console.log('Admin role:', existingAdmin.role);
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@loanapp.com',
      password: 'Admin123456789!',
      phone: '+1234567890',
      phoneNumber: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      street: '123 Admin Street',
      city: 'Admin City',
      state: 'AC',
      zipCode: '12345',
      country: 'USA',
      role: 'admin',
      isEmailVerified: true,
    });

    logger.info('Admin user created successfully!');
    console.log('Email: admin@loanapp.com');
    console.log('Password: Admin123456789!');
    process.exit(0);
  } catch (error) {
    logger.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();