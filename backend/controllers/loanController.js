const LoanProduct = require('../models/LoanProduct');
const Loan = require('../models/Loan');
const logger = require('../utils/logger');

const getLoanProducts = async (req, res) => {
  try {
    const { LoanProduct } = require('../models');
    const { type, minAmount, maxAmount } = req.query;
    const { Op } = require('sequelize');
    
    let whereCondition = { isActive: true };
    
    if (type) {
      whereCondition.type = type;
    }
    
    // Note: For complex JSON field queries, you might need to adjust based on your model structure
    // This assumes loanAmount is stored as JSON and may need adjustment
    if (minAmount || maxAmount) {
      // This is a simplified approach - adjust based on your actual model structure
      if (minAmount) {
        whereCondition['loanAmount.min'] = {
          [Op.lte]: parseInt(minAmount)
        };
      }
      if (maxAmount) {
        whereCondition['loanAmount.max'] = {
          [Op.gte]: parseInt(maxAmount)
        };
      }
    }

    const loanProducts = await LoanProduct.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        loanProducts,
        count: loanProducts.length,
      },
    });
  } catch (error) {
    logger.error('Get loan products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan products',
    });
  }
};

const getLoanProduct = async (req, res) => {
  try {
    const { LoanProduct } = require('../models');
    const loanProduct = await LoanProduct.findByPk(req.params.id);

    if (!loanProduct) {
      return res.status(404).json({
        success: false,
        message: 'Loan product not found',
      });
    }

    if (!loanProduct.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Loan product is not available',
      });
    }

    res.json({
      success: true,
      data: {
        loanProduct,
      },
    });
  } catch (error) {
    logger.error('Get loan product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan product',
    });
  }
};

const calculateLoanTerms = async (req, res) => {
  try {
    const { loanProductId, amount, term } = req.body;

    const { LoanProduct } = require('../models');
    const loanProduct = await LoanProduct.findByPk(loanProductId);
    if (!loanProduct) {
      return res.status(404).json({
        success: false,
        message: 'Loan product not found',
      });
    }

    if (amount < loanProduct.loanAmountMin || amount > loanProduct.loanAmountMax) {
      return res.status(400).json({
        success: false,
        message: `Loan amount must be between KSh ${loanProduct.loanAmountMin} and KSh ${loanProduct.loanAmountMax}`,
      });
    }

    if (term < loanProduct.termLengthMin || term > loanProduct.termLengthMax) {
      return res.status(400).json({
        success: false,
        message: `Loan term must be between ${loanProduct.termLengthMin} and ${loanProduct.termLengthMax} months`,
      });
    }

    const estimatedRate = (loanProduct.interestRateMin + loanProduct.interestRateMax) / 2;
    
    const monthlyRate = estimatedRate / 100 / 12;
    const numPayments = term;
    
    let monthlyPayment;
    if (monthlyRate === 0) {
      monthlyPayment = amount / numPayments;
    } else {
      monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                      (Math.pow(1 + monthlyRate, numPayments) - 1);
    }
    
    const totalPayback = monthlyPayment * numPayments;
    const totalInterest = totalPayback - amount;

    res.json({
      success: true,
      data: {
        principalAmount: amount,
        estimatedRate,
        termInMonths: term,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalPayback: Math.round(totalPayback * 100) / 100,
        fees: loanProduct.fees,
      },
    });
  } catch (error) {
    logger.error('Calculate loan terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate loan terms',
    });
  }
};

const getUserLoans = async (req, res) => {
  try {
    const { Loan, LoanProduct } = require('../models');
    const { status, page = 1, limit = 50 } = req.query; // Increased default limit
    
    let whereCondition = { borrowerId: req.user.id };
    if (status) {
      whereCondition.status = status;
    }

    logger.info(`Getting loans for user: ${req.user.id} with condition:`, whereCondition);

    const loans = await Loan.findAll({
      where: whereCondition,
      // Removed loanProduct include since we're using simple loan system
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await Loan.count({ where: whereCondition });

    logger.info(`Found ${loans.length} loans for user ${req.user.id}`);
    
    res.json({
      success: true,
      data: {
        loans,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
    });
  } catch (error) {
    logger.error('Get user loans error:', error);
    logger.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user loans',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getLoanDetails = async (req, res) => {
  try {
    const { Loan, LoanProduct, User } = require('../models');
    
    const loan = await Loan.findOne({
      where: {
        id: req.params.id,
        borrowerId: req.user.id,
      },
      include: [
        {
          model: LoanProduct,
          as: 'loanProduct',
          attributes: ['name', 'type', 'description']
        },
        {
          model: User,
          as: 'borrower',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    res.json({
      success: true,
      data: {
        loan,
      },
    });
  } catch (error) {
    logger.error('Get loan details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan details',
    });
  }
};

const makePayment = async (req, res) => {
  try {
    const { Loan } = require('../models');
    const { amount, method, transactionId } = req.body;
    const loanId = req.params.id;

    const loan = await Loan.findOne({
      where: {
        id: loanId,
        borrowerId: req.user.id,
        status: 'active',
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Active loan not found',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero',
      });
    }

    const payment = {
      amount,
      method,
      transactionId,
      paymentDate: new Date(),
      status: 'completed',
    };

    const nextPayment = loan.repaymentSchedule.find(payment => 
      payment.status === 'pending' || payment.status === 'partial'
    );

    if (nextPayment) {
      const remainingAmount = nextPayment.totalAmount - nextPayment.paidAmount;
      
      if (amount >= remainingAmount) {
        nextPayment.status = 'paid';
        nextPayment.paidAmount = nextPayment.totalAmount;
        nextPayment.paidDate = new Date();
        
        payment.principalPortion = nextPayment.principalAmount;
        payment.interestPortion = nextPayment.interestAmount;
        
        if (amount > remainingAmount) {
          const overpayment = amount - remainingAmount;
          loan.currentBalance = Math.max(0, loan.currentBalance - overpayment);
        }
      } else {
        nextPayment.status = 'partial';
        nextPayment.paidAmount += amount;
        
        const paymentRatio = amount / nextPayment.totalAmount;
        payment.principalPortion = nextPayment.principalAmount * paymentRatio;
        payment.interestPortion = nextPayment.interestAmount * paymentRatio;
      }
      
      loan.currentBalance = Math.max(0, loan.currentBalance - payment.principalPortion);
    }

    loan.payments.push(payment);
    loan.updateNextPaymentDue();

    if (loan.currentBalance === 0) {
      loan.status = 'paid_off';
    }

    await loan.save();

    logger.info(`Payment made for loan ${loan.loanId}: KSh ${amount}`);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment,
        currentBalance: loan.currentBalance,
        nextPaymentDue: loan.nextPaymentDue,
        loanStatus: loan.status,
      },
    });
  } catch (error) {
    logger.error('Make payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
    });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const loanId = req.params.id;

    const loan = await Loan.findOne({
      _id: loanId,
      borrower: req.user._id,
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    
    const payments = loan.payments
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      .slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        payments,
        totalPayments: loan.payments.length,
        totalPages: Math.ceil(loan.payments.length / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
    });
  }
};

module.exports = {
  getLoanProducts,
  getLoanProduct,
  calculateLoanTerms,
  getUserLoans,
  getLoanDetails,
  makePayment,
  getPaymentHistory,
};