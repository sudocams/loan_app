const { LoanApplication, LoanProduct, Loan, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const getAllApplications = async (req, res) => {
  try {
    const { 
      status, 
      assignedOfficer, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let whereClause = {};
    if (status) whereClause.status = status;
    if (assignedOfficer) whereClause.assignedOfficerId = assignedOfficer;

    const { count, rows: applications } = await LoanApplication.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['firstName', 'lastName', 'email', 'creditScore']
        },
        {
          model: LoanProduct,
          as: 'loanProduct',
          attributes: ['name', 'type', 'interestRateMin', 'interestRateMax']
        },
        {
          model: User,
          as: 'assignedOfficer',
          attributes: ['firstName', 'lastName', 'email'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        applications,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count,
      },
    });
  } catch (error) {
    logger.error('Get all applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
    });
  }
};

const getApplicationDetails = async (req, res) => {
  try {
    const application = await LoanApplication.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: { exclude: ['password'] }
        },
        {
          model: LoanProduct,
          as: 'loanProduct'
        },
        {
          model: User,
          as: 'assignedOfficer',
          attributes: ['firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      data: {
        application,
      },
    });
  } catch (error) {
    logger.error('Get application details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application details',
    });
  }
};

const assignOfficer = async (req, res) => {
  try {
    const { officerId } = req.body;
    const applicationId = req.params.id;

    const officer = await User.findOne({ 
      where: {
        id: officerId,
        role: { [Op.in]: ['loan_officer', 'admin'] }
      }
    });

    if (!officer) {
      return res.status(404).json({
        success: false,
        message: 'Loan officer not found',
      });
    }

    const application = await LoanApplication.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    application.assignedOfficerId = officerId;
    if (application.status === 'submitted') {
      application.status = 'under_review';
    }

    const reviewHistory = application.reviewHistory || [];
    reviewHistory.push({
      reviewedBy: req.user.id,
      status: 'assigned',
      comments: `Assigned to ${officer.firstName} ${officer.lastName}`,
      reviewDate: new Date()
    });
    application.reviewHistory = reviewHistory;

    await application.save();

    logger.info(`Application ${application.applicationId} assigned to ${officer.email}`);

    res.json({
      success: true,
      message: 'Officer assigned successfully',
      data: {
        application,
      },
    });
  } catch (error) {
    logger.error('Assign officer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign officer',
    });
  }
};

const reviewApplication = async (req, res) => {
  try {
    const { status, comments, approvedTerms } = req.body;
    const applicationId = req.params.id;

    const application = await LoanApplication.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (!['under_review', 'pending_documents'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Application cannot be reviewed in its current status',
      });
    }

    application.status = status;
    application.reviewedAt = new Date();

    if (status === 'approved' && approvedTerms) {
      application.approvedAmount = approvedTerms.approvedAmount;
      application.approvedRate = approvedTerms.approvedRate;
      application.approvedTerm = approvedTerms.approvedTerm;
      application.monthlyPayment = approvedTerms.monthlyPayment;
      application.totalInterest = approvedTerms.totalInterest;
      application.totalPayback = approvedTerms.totalPayback;
      application.decidedAt = new Date();
    } else if (status === 'rejected') {
      application.rejectionReason = comments;
      application.decidedAt = new Date();
    }

    const reviewHistory = application.reviewHistory || [];
    reviewHistory.push({
      reviewedBy: req.user.id,
      status,
      comments,
      reviewDate: new Date()
    });
    application.reviewHistory = reviewHistory;

    await application.save();

    if (status === 'approved') {
      await createLoanFromApplication(application);
    }

    logger.info(`Application ${application.applicationId} reviewed: ${status}`);

    res.json({
      success: true,
      message: 'Application reviewed successfully',
      data: {
        application,
      },
    });
  } catch (error) {
    logger.error('Review application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review application',
    });
  }
};

const createLoanFromApplication = async (application) => {
  try {
    const loan = await Loan.create({
      applicationId: application.id,
      borrowerId: application.applicantId,
      loanProductId: application.loanProductId,
      principalAmount: application.approvedAmount,
      interestRate: application.approvedRate,
      termInMonths: application.approvedTerm,
      monthlyPayment: application.monthlyPayment,
      totalInterest: application.totalInterest,
      totalPayback: application.totalPayback,
      currentBalance: application.approvedAmount,
      startDate: new Date(),
      maturityDate: new Date(Date.now() + application.approvedTerm * 30 * 24 * 60 * 60 * 1000),
    });

    const repaymentSchedule = loan.generateRepaymentSchedule();
    loan.repaymentSchedule = repaymentSchedule;
    loan.updateNextPaymentDue();

    await loan.save();
    
    logger.info(`Loan created from application: ${application.applicationId} -> ${loan.loanId}`);
    
    return loan;
  } catch (error) {
    logger.error('Create loan from application error:', error);
    throw error;
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      activeLoans,
      totalLoanAmount
    ] = await Promise.all([
      LoanApplication.count(),
      LoanApplication.count({ where: { status: { [Op.in]: ['submitted', 'under_review'] } } }),
      LoanApplication.count({ where: { status: 'approved' } }),
      LoanApplication.count({ where: { status: 'rejected' } }),
      Loan.count({ where: { status: 'active' } }),
      Loan.sum('currentBalance', { where: { status: 'active' } })
    ]);

    const recentApplications = await LoanApplication.findAll({
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: LoanProduct,
          as: 'loanProduct',
          attributes: ['name', 'type']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalApplications,
          pendingApplications,
          approvedApplications,
          rejectedApplications,
          activeLoans,
          totalLoanAmount: totalLoanAmount || 0,
          overduePayments: 0,
        },
        recentApplications,
      },
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
};

const createLoanProduct = async (req, res) => {
  try {
    const loanProduct = await LoanProduct.create(req.body);

    logger.info(`New loan product created: ${loanProduct.name}`);

    res.status(201).json({
      success: true,
      message: 'Loan product created successfully',
      data: {
        loanProduct,
      },
    });
  } catch (error) {
    logger.error('Create loan product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create loan product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const updateLoanProduct = async (req, res) => {
  try {
    const [updatedRowsCount] = await LoanProduct.update(
      req.body,
      { 
        where: { id: req.params.id },
        returning: true
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Loan product not found',
      });
    }

    const loanProduct = await LoanProduct.findByPk(req.params.id);

    logger.info(`Loan product updated: ${loanProduct.name}`);

    res.json({
      success: true,
      message: 'Loan product updated successfully',
      data: {
        loanProduct,
      },
    });
  } catch (error) {
    logger.error('Update loan product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update loan product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getAllLoans = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let whereClause = {};
    if (status) whereClause.status = status;

    const { count, rows: loans } = await Loan.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'borrower',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: LoanProduct,
          as: 'loanProduct',
          attributes: ['name', 'type']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        loans,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count,
      },
    });
  } catch (error) {
    logger.error('Get all loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
    });
  }
};

const getLoanOfficers = async (req, res) => {
  try {
    const officers = await User.findAll({ 
      where: {
        role: { [Op.in]: ['loan_officer', 'admin'] }
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role']
    });

    res.json({
      success: true,
      data: {
        officers,
      },
    });
  } catch (error) {
    logger.error('Get loan officers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan officers',
    });
  }
};

module.exports = {
  getAllApplications,
  getApplicationDetails,
  assignOfficer,
  reviewApplication,
  getDashboardStats,
  createLoanProduct,
  updateLoanProduct,
  getAllLoans,
  getLoanOfficers,
};