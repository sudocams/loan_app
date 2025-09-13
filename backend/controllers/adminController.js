const { LoanApplication, LoanProduct, Loan, User, Contribution, Expenditure } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
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
    
    // If user is a loan officer, only show applications assigned to them
    if (req.user.role === 'loan_officer') {
      whereClause.assignedOfficerId = req.user.id;
    } else if (assignedOfficer) {
      // Admin can filter by any assigned officer
      whereClause.assignedOfficerId = assignedOfficer;
    }

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

    // If user is a loan officer, ensure they can only access applications assigned to them
    if (req.user.role === 'loan_officer' && application.assignedOfficerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view applications assigned to you.',
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

    let reviewHistory = application.reviewHistory || [];
    // Ensure reviewHistory is an array (in case it's stored as JSON string)
    if (typeof reviewHistory === 'string') {
      try {
        reviewHistory = JSON.parse(reviewHistory);
      } catch (error) {
        reviewHistory = [];
      }
    }
    if (!Array.isArray(reviewHistory)) {
      reviewHistory = [];
    }
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

    // If user is a loan officer, ensure they can only review applications assigned to them
    if (req.user.role === 'loan_officer' && application.assignedOfficerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only review applications assigned to you.',
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

    let reviewHistory = application.reviewHistory || [];
    // Ensure reviewHistory is an array (in case it's stored as JSON string)
    if (typeof reviewHistory === 'string') {
      try {
        reviewHistory = JSON.parse(reviewHistory);
      } catch (error) {
        reviewHistory = [];
      }
    }
    if (!Array.isArray(reviewHistory)) {
      reviewHistory = [];
    }
    reviewHistory.push({
      reviewedBy: req.user.id,
      status,
      comments,
      reviewDate: new Date()
    });
    application.reviewHistory = reviewHistory;

    await application.save();

    if (status === 'approved') {
      logger.info(`Application approved, creating loan for application ${application.id}`);
      try {
        const loan = await createLoanFromApplication(application);
        logger.info(`Loan created successfully: ${loan.loanId}`);
      } catch (loanError) {
        logger.error(`Failed to create loan for application ${application.id}:`, loanError);
        throw loanError; // Re-throw to make the approval fail if loan creation fails
      }
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
    logger.info(`Creating loan from application: ${application.applicationId} for user: ${application.applicantId}`);
    
    // Default values for simple loan system (20,000 KSh limit)
    const principalAmount = parseFloat(application.approvedAmount || application.requestedAmount);
    const termMonths = application.approvedTerm || 12; // Default 12 months
    const interestRate = application.approvedRate || 15.0; // Default 15% annual rate
    
    // Determine loan fee based on loan amount
    let processingFee = 100; // Default fee
    if (principalAmount >= 15000) {
      processingFee = 500;
    } else if (principalAmount >= 10000) {
      processingFee = 300;
    } else if (principalAmount >= 5000) {
      processingFee = 200;
    }
    
    // Calculate total loan amount including fee
    const totalLoanAmount = principalAmount + processingFee;
    const monthlyPayment = application.monthlyPayment || (totalLoanAmount / termMonths);
    
    logger.info(`Loan calculation: Principal: ${principalAmount}, Fee: ${processingFee}, Total: ${totalLoanAmount}`);
    
    // Generate unique loan ID
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const loanId = `LN-${timestamp}-${random}`;

    const loanData = {
      loanId: loanId,
      applicationId: application.id,
      borrowerId: application.applicantId,
      loanProductId: null, // No loan products - simple limit system
      principalAmount: principalAmount,
      interestRate: interestRate,
      termInMonths: termMonths,
      monthlyPayment: monthlyPayment,
      totalInterest: application.totalInterest || 0,
      totalPayback: application.totalPayback || totalLoanAmount,
      currentBalance: totalLoanAmount, // Current balance includes fee
      processingFees: processingFee,
      amountPaid: 0, // Initialize amount paid to 0
      startDate: new Date(),
      maturityDate: new Date(Date.now() + termMonths * 30 * 24 * 60 * 60 * 1000),
      status: 'active'
    };

    logger.info(`Creating loan with data:`, JSON.stringify(loanData, null, 2));
    const loan = await Loan.create(loanData);

    // Generate repayment schedule
    if (loan.generateRepaymentSchedule) {
      const repaymentSchedule = loan.generateRepaymentSchedule();
      loan.repaymentSchedule = repaymentSchedule;
      
      if (loan.updateNextPaymentDue) {
        loan.updateNextPaymentDue();
      }
      
      await loan.save();
    }
    
    logger.info(`Loan created successfully: ${loan.loanId} for borrower: ${loan.borrowerId} amount: ${loan.principalAmount}`);
    
    return loan;
  } catch (error) {
    logger.error('Create loan from application error:', error);
    logger.error('Application data:', JSON.stringify(application, null, 2));
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
      paidLoans,
      totalLoanAmount
    ] = await Promise.all([
      LoanApplication.count(),
      LoanApplication.count({ where: { status: { [Op.in]: ['submitted', 'under_review'] } } }),
      LoanApplication.count({ where: { status: 'approved' } }),
      LoanApplication.count({ where: { status: 'rejected' } }),
      Loan.count({ where: { status: 'active' } }),
      Loan.count({ where: { status: 'paid' } }),
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
          paidLoans,
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
      limit = 50, // Increased default limit
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let whereClause = {};
    if (status) whereClause.status = status;

    logger.info(`Admin getAllLoans: whereClause=${JSON.stringify(whereClause)}, limit=${limit}`);

    const { count, rows: loans } = await Loan.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'borrower',
          attributes: ['firstName', 'lastName', 'email']
        }
        // Removed loanProduct include since we're using simple loan system
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    logger.info(`Found ${loans.length} loans out of ${count} total`);

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
    logger.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      role
    } = req.query;
    
    let whereClause = {};
    if (role) whereClause.role = role;

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'phoneNumber', 'isEmailVerified', 'createdAt', 'lastLoginAt'],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count,
      },
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

const updateLoanPaymentStatus = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { amountPaid, isPaid } = req.body;
    
    logger.info(`Updating payment for loan ${loanId}, amountPaid: ${amountPaid}, isPaid: ${isPaid}`);

    const loan = await Loan.findByPk(loanId, {
      include: [
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

    const principalAmount = parseFloat(loan.principalAmount);
    const processingFees = parseFloat(loan.processingFees || 0);
    const totalLoanAmount = principalAmount + processingFees;

    // Handle specific amount paid
    if (amountPaid !== undefined) {
      const newAmountPaid = Math.max(0, Math.min(parseFloat(amountPaid), totalLoanAmount));
      loan.amountPaid = newAmountPaid;
      loan.currentBalance = totalLoanAmount - newAmountPaid;
      
      // Update status based on payment
      if (newAmountPaid >= totalLoanAmount) {
        loan.status = 'paid';
        loan.paidAt = new Date();
      } else if (newAmountPaid > 0) {
        loan.status = 'active';
        loan.paidAt = null;
      } else {
        loan.status = 'active';
        loan.paidAt = null;
      }
      
      logger.info(`Payment updated for loan ${loan.loanId}: Paid ${newAmountPaid} of ${totalLoanAmount}, Balance: ${loan.currentBalance}`);
    }
    // Handle boolean paid/unpaid (legacy support)
    else if (isPaid !== undefined) {
      if (isPaid) {
        loan.amountPaid = totalLoanAmount;
        loan.currentBalance = 0;
        loan.status = 'paid';
        loan.paidAt = new Date();
      } else {
        loan.amountPaid = 0;
        loan.currentBalance = totalLoanAmount;
        loan.status = 'active';
        loan.paidAt = null;
      }
    }

    await loan.save();

    logger.info(`Loan ${loan.loanId} payment updated: paid ${loan.amountPaid}/${principalAmount}, balance: ${loan.currentBalance}`);

    res.json({
      success: true,
      message: 'Loan payment updated successfully',
      data: {
        loan,
      },
    });
  } catch (error) {
    logger.error('Update loan payment status error:', error);
    logger.error('Request params:', req.params);
    logger.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      message: 'Failed to update loan payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getContributions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      sortBy = 'contributionDate',
      sortOrder = 'desc',
      status = 'confirmed'
    } = req.query;

    let whereClause = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const { count, rows: contributions } = await Contribution.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'contributor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'recorder',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Calculate total contributions per user
    const userTotals = await Contribution.findAll({
      attributes: [
        'userId',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalContributions']
      ],
      where: { status: 'confirmed' },
      group: ['userId']
    });

    const userTotalsMap = {};
    userTotals.forEach(total => {
      userTotalsMap[total.userId] = parseFloat(total.dataValues.totalContributions || 0);
    });

    // Format contributions for response
    const formattedContributions = contributions.map(contribution => ({
      id: contribution.id,
      contributionId: contribution.contributionId,
      userId: contribution.userId,
      firstName: contribution.contributor?.firstName || 'Unknown',
      lastName: contribution.contributor?.lastName || '',
      email: contribution.contributor?.email,
      amount: parseFloat(contribution.amount),
      amountContributed: parseFloat(contribution.amount), // For monthly contributions, this is the same as amount
      date: contribution.contributionDate,
      paymentMethod: contribution.paymentMethod,
      referenceNumber: contribution.referenceNumber,
      status: contribution.status,
      notes: contribution.notes,
      recordedBy: contribution.recorder ? `${contribution.recorder.firstName} ${contribution.recorder.lastName}` : null,
      totalContributions: userTotalsMap[contribution.userId] || 0,
      createdAt: contribution.createdAt
    }));

    logger.info(`Found ${contributions.length} contributions out of ${count} total`);

    res.json({
      success: true,
      data: {
        contributions: formattedContributions,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count,
      },
    });
  } catch (error) {
    logger.error('Get contributions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contributions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createContribution = async (req, res) => {
  try {
    const { userId, amount, paymentMethod, referenceNumber, notes } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'User ID and valid amount are required',
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate contribution ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const contributionId = `CONT-${timestamp}-${random}`;

    const contribution = await Contribution.create({
      contributionId,
      userId,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'mobile_money',
      referenceNumber,
      notes,
      recordedBy: req.user.id,
      status: 'confirmed'
    });

    const contributionWithUser = await Contribution.findByPk(contribution.id, {
      include: [
        {
          model: User,
          as: 'contributor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    logger.info(`Contribution created: ${contributionId} for user ${user.firstName} ${user.lastName}, amount: ${amount}`);

    res.status(201).json({
      success: true,
      message: 'Contribution recorded successfully',
      data: {
        contribution: contributionWithUser,
      },
    });
  } catch (error) {
    logger.error('Create contribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record contribution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateContribution = async (req, res) => {
  try {
    const { contributionId } = req.params;
    const { amount, paymentMethod, referenceNumber, notes, status } = req.body;

    const contribution = await Contribution.findByPk(contributionId);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found',
      });
    }

    const updates = {};
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (referenceNumber !== undefined) updates.referenceNumber = referenceNumber;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;

    await contribution.update(updates);

    const updatedContribution = await Contribution.findByPk(contributionId, {
      include: [
        {
          model: User,
          as: 'contributor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    logger.info(`Contribution updated: ${contribution.contributionId}`);

    res.json({
      success: true,
      message: 'Contribution updated successfully',
      data: {
        contribution: updatedContribution,
      },
    });
  } catch (error) {
    logger.error('Update contribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contribution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getFinancialMetrics = async (req, res) => {
  try {
    logger.info('Fetching comprehensive financial metrics...');

    // Calculate financial metrics in parallel
    const [
      totalContributions,
      totalProcessingFees,
      totalLoansPrincipal,
      totalAmountPaid,
      totalCurrentBalance,
      activeLoansCount,
      paidLoansCount,
      totalContributionsCount,
      totalExpenditures,
      totalExpendituresCount
    ] = await Promise.all([
      // Total contributions (confirmed)
      Contribution.sum('amount', { 
        where: { status: 'confirmed' } 
      }),
      
      // Total collected loan fees (processing fees from all loans)
      Loan.sum('processingFees'),
      
      // Total loans principal amount
      Loan.sum('principalAmount', { 
        where: { status: { [Op.in]: ['active', 'paid'] } } 
      }),
      
      // Total amount paid by borrowers
      Loan.sum('amountPaid'),
      
      // Outstanding loan amounts (current balances)
      Loan.sum('currentBalance', { 
        where: { status: 'active' } 
      }),
      
      // Count of active loans
      Loan.count({ where: { status: 'active' } }),
      
      // Count of paid loans
      Loan.count({ where: { status: 'paid' } }),
      
      // Count of contributions
      Contribution.count({ where: { status: 'confirmed' } }),
      
      // Total expenditures (paid)
      Expenditure.sum('amount', { 
        where: { status: 'paid' } 
      }),
      
      // Count of expenditures
      Expenditure.count({ where: { status: 'paid' } })
    ]);

    // Calculate derived metrics
    const totalLoanFees = parseFloat(totalProcessingFees) || 0;
    const totalContributionsAmount = parseFloat(totalContributions) || 0;
    const totalPrincipal = parseFloat(totalLoansPrincipal) || 0;
    const totalPaid = parseFloat(totalAmountPaid) || 0;
    const outstandingLoans = parseFloat(totalCurrentBalance) || 0;
    
    // Actual expenditures from the database
    const expenditures = parseFloat(totalExpenditures) || 0;
    
    // Transaction charges (placeholder - would include banking fees, transfer fees, etc.)
    const transactionCharges = totalLoanFees * 0.05; // Assume 5% of loan fees go to transaction charges
    
    // Available balance calculations
    const totalIncome = totalContributionsAmount + totalLoanFees + totalPaid;
    const availableBalanceAfterExpenditure = totalIncome - expenditures - transactionCharges;
    const availableBalanceForLoans = totalContributionsAmount - outstandingLoans - expenditures;
    
    // Current bank balance (total income minus expenditures and transaction charges)
    const currentBankBalance = totalIncome - expenditures - transactionCharges;

    const metrics = {
      // Core metrics
      totalContributions: totalContributionsAmount,
      totalCollectedLoanFees: totalLoanFees,
      expenditures: expenditures,
      outstandingLoans: outstandingLoans,
      transactionCharges: transactionCharges,
      
      // Calculated balances
      availableBalanceAfterExpenditure: availableBalanceAfterExpenditure,
      availableBalanceForLoans: availableBalanceForLoans,
      currentBankBalance: currentBankBalance,
      
      // Additional useful metrics
      totalLoansPrincipal: totalPrincipal,
      totalAmountPaid: totalPaid,
      activeLoansCount: activeLoansCount,
      paidLoansCount: paidLoansCount,
      totalContributionsCount: totalContributionsCount,
      totalExpendituresCount: totalExpendituresCount,
      
      // Ratios and percentages
      collectionRate: totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0,
      outstandingLoanRatio: totalContributionsAmount > 0 ? (outstandingLoans / totalContributionsAmount) * 100 : 0,
      expenditureRatio: totalContributionsAmount > 0 ? (expenditures / totalContributionsAmount) * 100 : 0
    };

    logger.info(`Financial metrics calculated:`, JSON.stringify(metrics, null, 2));

    res.json({
      success: true,
      data: {
        metrics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get financial metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
  getAllUsers,
  updateLoanPaymentStatus,
  getContributions,
  createContribution,
  updateContribution,
  getFinancialMetrics,
};