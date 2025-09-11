const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LoanProduct = sequelize.define('LoanProduct', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.ENUM('personal', 'home', 'auto', 'business', 'student'),
    allowNull: false,
  },
  interestRateMin: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  interestRateMax: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  loanAmountMin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  loanAmountMax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  termLengthMin: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  termLengthMax: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  minCreditScore: {
    type: DataTypes.INTEGER,
    defaultValue: 600,
  },
  minIncome: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 25000,
  },
  maxDebtToIncomeRatio: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.4,
  },
  minAge: {
    type: DataTypes.INTEGER,
    defaultValue: 18,
  },
  employmentRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  originationFee: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  processingFee: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
  },
  prepaymentPenalty: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  requiredDocuments: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  timestamps: true,
});

module.exports = LoanProduct;