const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  loanId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  applicationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'LoanApplications',
      key: 'id'
    }
  },
  borrowerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  loanProductId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'LoanProducts',
      key: 'id'
    }
  },
  principalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  termInMonths: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  monthlyPayment: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  totalInterest: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  totalPayback: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  disbursementAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  disbursementDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  disbursementMethod: {
    type: DataTypes.ENUM('direct_deposit', 'check', 'wire_transfer'),
    allowNull: true,
  },
  bankAccountNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  routingNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  disbursementStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  repaymentSchedule: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  payments: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('active', 'paid_off', 'defaulted', 'cancelled'),
    defaultValue: 'active',
  },
  currentBalance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  nextPaymentAmount: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
  },
  nextPaymentDueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lateFees: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
  },
  processingFees: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
  },
  prepaymentFees: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
  },
  autoPayEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  emailReminders: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  smsReminders: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  reminderDaysBefore: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
  },
  notes: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  maturityDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (loan) => {
      if (!loan.loanId) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        loan.loanId = `LN-${timestamp}-${random}`;
      }
    }
  }
});

Loan.prototype.generateRepaymentSchedule = function() {
  const schedule = [];
  const principalAmount = parseFloat(this.principalAmount);
  const interestRate = parseFloat(this.interestRate);
  const termInMonths = this.termInMonths;
  const monthlyPayment = parseFloat(this.monthlyPayment);
  
  let remainingBalance = principalAmount;
  const monthlyInterestRate = interestRate / 100 / 12;
  
  for (let i = 1; i <= termInMonths; i++) {
    const interestAmount = remainingBalance * monthlyInterestRate;
    const principalPayment = monthlyPayment - interestAmount;
    remainingBalance -= principalPayment;
    
    if (remainingBalance < 0) {
      remainingBalance = 0;
    }
    
    const dueDate = new Date(this.startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      paymentNumber: i,
      dueDate,
      principalAmount: Math.round(principalPayment * 100) / 100,
      interestAmount: Math.round(interestAmount * 100) / 100,
      totalAmount: monthlyPayment,
      remainingBalance: Math.round(remainingBalance * 100) / 100,
      status: 'pending',
      paidAmount: 0,
      paidDate: null
    });
  }
  
  return schedule;
};

Loan.prototype.updateNextPaymentDue = function() {
  const nextPayment = this.repaymentSchedule.find(payment => 
    payment.status === 'pending' || payment.status === 'partial'
  );
  
  if (nextPayment) {
    this.nextPaymentAmount = nextPayment.totalAmount - nextPayment.paidAmount;
    this.nextPaymentDueDate = nextPayment.dueDate;
  }
};

module.exports = Loan;