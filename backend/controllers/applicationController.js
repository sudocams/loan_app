const LoanApplication = require('../models/LoanApplication');
const LoanProduct = require('../models/LoanProduct');
const Loan = require('../models/Loan');
const logger = require('../utils/logger');

const createApplication = async (req, res) => {
  try {
    const { LoanApplication, LoanProduct } = require('../models');
    const {
      loanProduct,
      requestedAmount,
      requestedTerm,
      purpose,
      purposeDescription,
      financialInfo,
    } = req.body;

    const loanProductData = await LoanProduct.findByPk(loanProduct);
    if (!loanProductData || !loanProductData.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Loan product not found or inactive',
      });
    }

    if (requestedAmount < loanProductData.loanAmount.min || 
        requestedAmount > loanProductData.loanAmount.max) {
      return res.status(400).json({
        success: false,
        message: `Requested amount must be between KSh ${loanProductData.loanAmount.min} and KSh ${loanProductData.loanAmount.max}`,
      });
    }

    if (requestedTerm < loanProductData.termLength.min || 
        requestedTerm > loanProductData.termLength.max) {
      return res.status(400).json({
        success: false,
        message: `Requested term must be between ${loanProductData.termLength.min} and ${loanProductData.termLength.max} months`,
      });
    }

    // Generate application ID
    const applicationId = 'LA' + Date.now() + Math.floor(Math.random() * 1000);

    const application = await LoanApplication.create({
      applicationId,
      applicantId: req.user.id,
      loanProductId: loanProduct,
      requestedAmount,
      requestedTerm,
      purpose,
      purposeDescription,
      financialInfo,
    });

    const applicationWithProduct = await LoanApplication.findByPk(application.id, {
      include: [
        {
          model: LoanProduct,
          as: 'loanProduct',
          attributes: ['name', 'type']
        }
      ]
    });

    logger.info(`New loan application created: ${application.applicationId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Loan application created successfully',
      data: {
        application: applicationWithProduct,
      },
    });
  } catch (error) {
    logger.error('Create application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create loan application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getUserApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const { LoanApplication, LoanProduct, User } = require('../models');
    
    let whereCondition = { applicantId: req.user.id };
    if (status) {
      whereCondition.status = status;
    }

    const applications = await LoanApplication.findAll({
      where: whereCondition,
      include: [
        {
          model: LoanProduct,
          as: 'loanProduct',
          attributes: ['name', 'type', 'interestRateMin', 'interestRateMax']
        },
        {
          model: User,
          as: 'assignedOfficer',
          attributes: ['firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await LoanApplication.count({
      where: whereCondition
    });

    res.json({
      success: true,
      data: {
        applications,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
    });
  } catch (error) {
    logger.error('Get user applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
    });
  }
};

const getApplication = async (req, res) => {
  try {
    const { LoanApplication, LoanProduct, User } = require('../models');
    
    const application = await LoanApplication.findOne({
      where: {
        id: req.params.id,
        applicantId: req.user.id,
      },
      include: [
        {
          model: LoanProduct,
          as: 'loanProduct',
          attributes: ['name', 'type', 'description', 'interestRateMin', 'interestRateMax', 'loanAmountMin', 'loanAmountMax', 'termLengthMin', 'termLengthMax']
        },
        {
          model: User,
          as: 'applicant',
          attributes: ['firstName', 'lastName', 'email', 'phone']
        },
        {
          model: User,
          as: 'assignedOfficer',
          attributes: ['firstName', 'lastName', 'email']
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
    logger.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
    });
  }
};

const updateApplication = async (req, res) => {
  try {
    const { LoanApplication, LoanProduct } = require('../models');
    
    const application = await LoanApplication.findOne({
      where: {
        id: req.params.id,
        applicantId: req.user.id,
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status !== 'draft' && application.status !== 'pending_documents') {
      return res.status(400).json({
        success: false,
        message: 'Application cannot be modified in its current status',
      });
    }

    const allowedUpdates = [
      'requestedAmount',
      'requestedTerm',
      'purpose',
      'purposeDescription',
      'financialInfo',
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    await application.update(updates);

    const updatedApplication = await LoanApplication.findByPk(application.id, {
      include: [
        {
          model: LoanProduct,
          as: 'loanProduct',
          attributes: ['name', 'type']
        }
      ]
    });

    logger.info(`Application updated: ${updatedApplication.applicationId}`);

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: {
        application: updatedApplication,
      },
    });
  } catch (error) {
    logger.error('Update application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const submitApplication = async (req, res) => {
  try {
    const { LoanApplication, LoanProduct, User } = require('../models');
    
    const application = await LoanApplication.findOne({
      where: {
        id: req.params.id,
        applicantId: req.user.id,
      },
      include: [
        {
          model: LoanProduct,
          as: 'loanProduct'
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been submitted',
      });
    }

    const requiredDocs = application.loanProduct.requiredDocuments || [];
    const uploadedDocs = application.documents ? application.documents.map(doc => doc.docType) : [];
    const missingDocs = requiredDocs.filter(doc => !uploadedDocs.includes(doc));

    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required documents',
        data: {
          missingDocuments: missingDocs,
        },
      });
    }

    // Get user details for risk calculation
    const user = await User.findByPk(req.user.id);
    
    const riskScore = calculateRiskScore(application, user);
    
    await application.update({
      status: 'submitted',
      submittedAt: new Date(),
      riskScore: riskScore.score,
      riskFactors: riskScore.factors,
      riskRecommendation: riskScore.recommendation,
    });

    logger.info(`Application submitted: ${application.applicationId}`);

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application,
      },
    });
  } catch (error) {
    logger.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
    });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { docType } = req.body;
    if (!docType) {
      return res.status(400).json({
        success: false,
        message: 'Document type is required',
      });
    }

    const { LoanApplication } = require('../models');
    
    const application = await LoanApplication.findOne({
      where: {
        id: req.params.id,
        applicantId: req.user.id,
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status !== 'draft' && application.status !== 'pending_documents') {
      return res.status(400).json({
        success: false,
        message: 'Documents cannot be uploaded for this application status',
      });
    }

    const documents = application.documents || [];
    const existingDocIndex = documents.findIndex(
      doc => doc.docType === docType
    );

    const documentInfo = {
      docType,
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadDate: new Date(),
    };

    if (existingDocIndex >= 0) {
      documents[existingDocIndex] = documentInfo;
    } else {
      documents.push(documentInfo);
    }

    await application.update({ documents });

    logger.info(`Document uploaded for application ${application.applicationId}: ${docType}`);

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: documentInfo,
      },
    });
  } catch (error) {
    logger.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { LoanApplication } = require('../models');
    const { docType } = req.params;
    
    const application = await LoanApplication.findOne({
      where: {
        id: req.params.id,
        applicantId: req.user.id,
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status !== 'draft' && application.status !== 'pending_documents') {
      return res.status(400).json({
        success: false,
        message: 'Documents cannot be removed for this application status',
      });
    }

    const documents = application.documents || [];
    const documentIndex = documents.findIndex(
      doc => doc.docType === docType
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    documents.splice(documentIndex, 1);
    await application.update({ documents });

    logger.info(`Document removed from application ${application.applicationId}: ${docType}`);

    res.json({
      success: true,
      message: 'Document removed successfully',
    });
  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove document',
    });
  }
};

const calculateRiskScore = (application, user) => {
  let score = 0;
  const factors = [];

  if (user.creditScore) {
    if (user.creditScore >= 750) {
      score += 25;
      factors.push('Excellent credit score');
    } else if (user.creditScore >= 700) {
      score += 20;
      factors.push('Good credit score');
    } else if (user.creditScore >= 650) {
      score += 15;
      factors.push('Fair credit score');
    } else {
      score += 5;
      factors.push('Poor credit score');
    }
  }

  const debtToIncomeRatio = application.calculateDebtToIncomeRatio();
  if (debtToIncomeRatio <= 0.3) {
    score += 25;
    factors.push('Low debt-to-income ratio');
  } else if (debtToIncomeRatio <= 0.4) {
    score += 15;
    factors.push('Moderate debt-to-income ratio');
  } else {
    score += 5;
    factors.push('High debt-to-income ratio');
  }

  const loanToIncomeRatio = application.requestedAmount / application.financialInfo.annualIncome;
  if (loanToIncomeRatio <= 0.5) {
    score += 20;
    factors.push('Conservative loan amount');
  } else if (loanToIncomeRatio <= 1) {
    score += 10;
    factors.push('Moderate loan amount');
  } else {
    score += 5;
    factors.push('High loan amount relative to income');
  }

  if (user.employmentInfo?.employmentType === 'full-time') {
    score += 15;
    factors.push('Stable employment');
  } else if (user.employmentInfo?.employmentType === 'part-time') {
    score += 10;
    factors.push('Part-time employment');
  } else {
    score += 5;
    factors.push('Unstable employment');
  }

  if (user.employmentInfo?.yearsAtCurrentJob >= 2) {
    score += 15;
    factors.push('Long tenure at current job');
  } else if (user.employmentInfo?.yearsAtCurrentJob >= 1) {
    score += 10;
    factors.push('Recent job history');
  }

  let recommendation;
  if (score >= 80) {
    recommendation = 'approve';
  } else if (score >= 60) {
    recommendation = 'manual_review';
  } else {
    recommendation = 'reject';
  }

  return { score, factors, recommendation };
};

// Calculate fee based on loan amount
const calculateLoanFee = (amount) => {
  if (amount >= 1000 && amount <= 5000) return 100;
  if (amount > 5000 && amount <= 10000) return 200;
  if (amount > 10000 && amount <= 15000) return 300;
  if (amount > 15000 && amount <= 20000) return 500;
  return 0;
};

// Check if user is eligible to apply for a loan
const checkLoanEligibility = async (req, res) => {
  try {
    const { User, LoanApplication, Loan } = require('../models');
    const { Op } = require('sequelize');
    
    // Check if user has any active loan applications
    const activeApplications = await LoanApplication.count({
      where: {
        applicantId: req.user.id,
        status: {
          [Op.in]: ['submitted', 'under_review', 'approved']
        }
      }
    });

    if (activeApplications > 0) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          message: 'You have an active loan application. Please wait for it to be processed before applying for a new loan.'
        }
      });
    }

    // Check if user has any active loans
    const activeLoans = await Loan.count({
      where: {
        borrowerId: req.user.id,
        status: 'active'
      }
    });

    if (activeLoans > 0) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          message: 'You currently have an active loan. Please complete your current loan before applying for a new one.'
        }
      });
    }

    // Check if user completed a loan recently (within 1 month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentCompletedLoans = await Loan.count({
      where: {
        borrowerId: req.user.id,
        status: 'paid_off',
        updatedAt: {
          [Op.gte]: oneMonthAgo
        }
      }
    });

    if (recentCompletedLoans > 0) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          message: 'You must wait one month after completing a loan before applying for a new one.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        eligible: true,
        message: 'You are eligible to apply for a loan.'
      }
    });

  } catch (error) {
    logger.error('Check loan eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check loan eligibility'
    });
  }
};

// Submit simplified loan application
const submitLoanApplication = async (req, res) => {
  try {
    const { LoanApplication } = require('../models');
    const { Op } = require('sequelize');
    
    const {
      requestedAmount,
      purpose,
      purposeDescription,
      fee,
      totalAmount
    } = req.body;

    // Validate amount
    if (!requestedAmount || requestedAmount < 1000 || requestedAmount > 20000) {
      return res.status(400).json({
        success: false,
        message: 'Loan amount must be between KSh 1,000 and KSh 20,000'
      });
    }

    // Verify fee calculation
    const calculatedFee = calculateLoanFee(requestedAmount);
    if (fee !== calculatedFee) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fee calculation'
      });
    }

    // Check eligibility again
    const { User, Loan } = require('../models');
    
    const activeApplications = await LoanApplication.count({
      where: {
        applicantId: req.user.id,
        status: {
          [Op.in]: ['submitted', 'under_review', 'approved']
        }
      }
    });

    const activeLoans = await Loan.count({
      where: {
        borrowerId: req.user.id,
        status: 'active'
      }
    });

    if (activeApplications > 0 || activeLoans > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active loan or application'
      });
    }

    // Generate application ID
    const applicationId = 'LA' + Date.now() + Math.floor(Math.random() * 1000);

    // Get first available loan product (seeding should ensure at least one exists)
    const { LoanProduct } = require('../models');
    let defaultLoanProduct = await LoanProduct.findOne({ where: { isActive: true } });
    
    // If no active loan product exists, create one for our simplified system
    if (!defaultLoanProduct) {
      defaultLoanProduct = await LoanProduct.create({
        name: 'Welfare Loan',
        description: 'Simplified welfare loan for amounts between KSh 1,000 - 20,000',
        type: 'personal',
        interestRateMin: 0,
        interestRateMax: 0,
        loanAmountMin: 1000,
        loanAmountMax: 20000,
        termLengthMin: 1,
        termLengthMax: 12,
        minCreditScore: 0,
        minIncome: 0,
        maxDebtToIncomeRatio: 1.0,
        minAge: 18,
        employmentRequired: false,
        originationFee: 0,
        processingFee: 0,
        prepaymentPenalty: 0,
        requiredDocuments: [],
        isActive: true
      });
    }

    // Create application with default values for required fields
    const application = await LoanApplication.create({
      applicationId,
      applicantId: req.user.id,
      loanProductId: defaultLoanProduct.id,
      requestedAmount,
      requestedTerm: Math.max(defaultLoanProduct.termLengthMin, 6), // Use minimum term from loan product or at least 6 months
      purpose,
      purposeDescription: purposeDescription || '',
      annualIncome: 0, // Default to 0, can be updated later
      monthlyExpenses: 0, // Default to 0, can be updated later
      status: 'submitted',
      submittedAt: new Date()
    });

    logger.info(`Loan application submitted: ${application.applicationId} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: {
        application: {
          applicationId: application.applicationId,
          requestedAmount: application.requestedAmount,
          requestedTerm: application.requestedTerm,
          purpose: application.purpose,
          purposeDescription: application.purposeDescription,
          status: application.status,
          submittedAt: application.submittedAt
        }
      }
    });

  } catch (error) {
    logger.error('Submit loan application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit loan application'
    });
  }
};

// Get all loans for admin view
const getAllLoansForAdmin = async (req, res) => {
  try {
    const { LoanApplication, User } = require('../models');
    
    const applications = await LoanApplication.findAll({
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedApplications = applications.map(app => ({
      id: app.id,
      applicationId: app.applicationId,
      applicant: app.applicant ? {
        id: app.applicant.id,
        name: `${app.applicant.firstName} ${app.applicant.lastName}`,
        email: app.applicant.email,
        phone: app.applicant.phone
      } : null,
      requestedAmount: app.requestedAmount,
      fee: app.fee || calculateLoanFee(app.requestedAmount),
      totalAmount: app.totalAmount || (app.requestedAmount + calculateLoanFee(app.requestedAmount)),
      purpose: app.purpose,
      purposeDescription: app.purposeDescription,
      status: app.status,
      submittedAt: app.submittedAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));

    res.json({
      success: true,
      data: {
        applications: formattedApplications,
        total: formattedApplications.length
      }
    });

  } catch (error) {
    logger.error('Get all loans for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans'
    });
  }
};

module.exports = {
  createApplication,
  getUserApplications,
  getApplication,
  updateApplication,
  submitApplication,
  uploadDocument,
  deleteDocument,
  checkLoanEligibility,
  submitLoanApplication,
  getAllLoansForAdmin,
};