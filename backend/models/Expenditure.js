const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expenditure = sequelize.define('Expenditure', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  expenditureId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  beneficiaryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('death', 'childbirth', 'wedding'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  expenditureDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'bank_transfer', 'mobile_money', 'cheque'),
    allowNull: false,
    defaultValue: 'bank_transfer',
  },
  referenceNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'paid', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paidBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'expenditures',
  timestamps: true,
  indexes: [
    {
      fields: ['beneficiaryId'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['expenditureDate'],
    },
  ],
});

module.exports = Expenditure;