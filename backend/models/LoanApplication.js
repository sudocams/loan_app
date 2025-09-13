const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LoanApplication = sequelize.define('LoanApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  applicationId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  applicantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  loanProductId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Made optional for simple loan system
    references: {
      model: 'LoanProducts',
      key: 'id'
    }
  },
  requestedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 1000
    }
  },
  requestedTerm: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 6,
      max: 360
    }
  },
  purpose: {
    type: DataTypes.ENUM('debt_consolidation', 'home_improvement', 'major_purchase', 'medical', 'vacation', 'business', 'education', 'other'),
    allowNull: false,
  },
  purposeDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  annualIncome: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  monthlyExpenses: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  existingDebts: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  savings: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  investments: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  realEstate: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  otherAssets: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  creditScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  creditReportDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  creditBureau: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'pending_documents', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'draft',
  },
  reviewHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  approvedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  approvedRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  approvedTerm: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  monthlyPayment: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
  },
  totalInterest: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  totalPayback: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  decidedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  assignedOfficerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  riskScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  riskFactors: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  riskRecommendation: {
    type: DataTypes.ENUM('approve', 'reject', 'manual_review'),
    allowNull: true,
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (application) => {
      if (!application.applicationId) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        application.applicationId = `LOAN-${timestamp}-${random}`;
      }
    }
  }
});

LoanApplication.prototype.calculateDebtToIncomeRatio = function() {
  const monthlyIncome = this.annualIncome / 12;
  const totalDebtPayments = this.existingDebts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
  return totalDebtPayments / monthlyIncome;
};

LoanApplication.prototype.calculateMonthlyPayment = function(amount, rate, term) {
  const monthlyRate = rate / 100 / 12;
  const numPayments = term;
  
  if (monthlyRate === 0) {
    return amount / numPayments;
  }
  
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                        (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return Math.round(monthlyPayment * 100) / 100;
};

module.exports = LoanApplication;