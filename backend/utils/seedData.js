const { User, LoanProduct } = require('../models');
const logger = require('./logger');

const seedLoanProducts = async () => {
  try {
    const existingProducts = await LoanProduct.count();
    if (existingProducts > 0) {
      logger.info('Loan products already exist, skipping seed');
      return;
    }

    const loanProducts = [
      {
        name: 'Personal Loan',
        description: 'Flexible personal loans for any purpose with competitive rates',
        type: 'personal',
        interestRateMin: 8.99,
        interestRateMax: 24.99,
        loanAmountMin: 1000,
        loanAmountMax: 50000,
        termLengthMin: 12,
        termLengthMax: 84,
        minCreditScore: 600,
        minIncome: 30000,
        maxDebtToIncomeRatio: 0.4,
        minAge: 18,
        employmentRequired: true,
        originationFee: 1.99,
        processingFee: 50,
        prepaymentPenalty: 0,
        requiredDocuments: ['id', 'income_proof', 'address_proof', 'bank_statement'],
      },
      {
        name: 'Home Loan',
        description: 'Affordable home loans with flexible terms and competitive rates',
        type: 'home',
        interestRateMin: 3.25,
        interestRateMax: 7.5,
        loanAmountMin: 50000,
        loanAmountMax: 1000000,
        termLengthMin: 120,
        termLengthMax: 360,
        minCreditScore: 620,
        minIncome: 50000,
        maxDebtToIncomeRatio: 0.43,
        minAge: 18,
        employmentRequired: true,
        originationFee: 0.5,
        processingFee: 500,
        prepaymentPenalty: 2,
        requiredDocuments: ['id', 'income_proof', 'address_proof', 'bank_statement', 'employment_letter', 'tax_returns'],
      },
      {
        name: 'Auto Loan',
        description: 'Quick and easy auto loans for new and used vehicles',
        type: 'auto',
        interestRateMin: 4.99,
        interestRateMax: 18.99,
        loanAmountMin: 5000,
        loanAmountMax: 100000,
        termLengthMin: 24,
        termLengthMax: 84,
        minCreditScore: 580,
        minIncome: 25000,
        maxDebtToIncomeRatio: 0.45,
        minAge: 18,
        employmentRequired: true,
        originationFee: 0,
        processingFee: 100,
        prepaymentPenalty: 0,
        requiredDocuments: ['id', 'income_proof', 'address_proof', 'bank_statement'],
      },
      {
        name: 'Business Loan',
        description: 'Capital for your business growth and expansion needs',
        type: 'business',
        interestRateMin: 6.99,
        interestRateMax: 29.99,
        loanAmountMin: 10000,
        loanAmountMax: 500000,
        termLengthMin: 12,
        termLengthMax: 120,
        minCreditScore: 650,
        minIncome: 75000,
        maxDebtToIncomeRatio: 0.35,
        minAge: 21,
        employmentRequired: false,
        originationFee: 2.5,
        processingFee: 200,
        prepaymentPenalty: 3,
        requiredDocuments: ['id', 'income_proof', 'address_proof', 'bank_statement', 'tax_returns'],
      },
      {
        name: 'Student Loan',
        description: 'Educational loans to help finance your academic journey',
        type: 'student',
        interestRateMin: 5.50,
        interestRateMax: 12.99,
        loanAmountMin: 1000,
        loanAmountMax: 200000,
        termLengthMin: 60,
        termLengthMax: 240,
        minCreditScore: 550,
        minIncome: 0,
        maxDebtToIncomeRatio: 0.5,
        minAge: 17,
        employmentRequired: false,
        originationFee: 1,
        processingFee: 25,
        prepaymentPenalty: 0,
        requiredDocuments: ['id', 'address_proof', 'bank_statement'],
      },
    ];

    await LoanProduct.bulkCreate(loanProducts);
    logger.info(`Seeded ${loanProducts.length} loan products`);
  } catch (error) {
    logger.error('Error seeding loan products:', error);
  }
};

const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      logger.info('Admin user already exists, skipping seed');
      return;
    }

    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@loanapp.com',
      password: 'Admin123!',
      phone: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      street: '123 Admin Street',
      city: 'Admin City',
      state: 'AC',
      zipCode: '12345',
      country: 'USA',
      role: 'admin',
      isEmailVerified: true,
    });

    logger.info('Admin user created: admin@loanapp.com / Admin123!');
  } catch (error) {
    logger.error('Error seeding admin user:', error);
  }
};

const seedLoanOfficer = async () => {
  try {
    const existingOfficer = await User.findOne({ where: { role: 'loan_officer' } });
    if (existingOfficer) {
      logger.info('Loan officer already exists, skipping seed');
      return;
    }

    const loanOfficer = await User.create({
      firstName: 'John',
      lastName: 'Officer',
      email: 'officer@loanapp.com',
      password: 'Officer123!',
      phone: '+1234567891',
      dateOfBirth: new Date('1985-05-15'),
      street: '456 Officer Lane',
      city: 'Officer City',
      state: 'OC',
      zipCode: '54321',
      country: 'USA',
      role: 'loan_officer',
      isEmailVerified: true,
    });

    logger.info('Loan officer created: officer@loanapp.com / Officer123!');
  } catch (error) {
    logger.error('Error seeding loan officer:', error);
  }
};

const seedDatabase = async () => {
  try {
    await seedLoanProducts();
    await seedAdminUser();
    await seedLoanOfficer();
    logger.info('Database seeding completed');
  } catch (error) {
    logger.error('Database seeding failed:', error);
  }
};

module.exports = {
  seedDatabase,
  seedLoanProducts,
  seedAdminUser,
  seedLoanOfficer,
};