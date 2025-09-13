const { Expenditure, User } = require('../models');
const { Op, fn, col } = require('sequelize');
const logger = require('../utils/logger');

const getAllExpenditures = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      sortBy = 'expenditureDate',
      sortOrder = 'desc',
      status = 'all',
      type = 'all'
    } = req.query;

    let whereClause = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (type && type !== 'all') {
      whereClause.type = type;
    }

    const { count, rows: expenditures } = await Expenditure.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'beneficiary',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    logger.info(`Found ${expenditures.length} expenditures out of ${count} total`);

    res.json({
      success: true,
      data: {
        expenditures,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        total: count,
      },
    });
  } catch (error) {
    logger.error('Get all expenditures error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenditures',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createExpenditure = async (req, res) => {
  try {
    const { 
      beneficiaryId, 
      type, 
      amount, 
      description, 
      paymentMethod, 
      referenceNumber 
    } = req.body;

    if (!beneficiaryId || !type || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary ID, type, and valid amount are required',
      });
    }

    // Check if beneficiary exists
    const beneficiary = await User.findByPk(beneficiaryId);
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    // Generate expenditure ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const expenditureId = `EXP-${type.toUpperCase()}-${timestamp}-${random}`;

    const expenditure = await Expenditure.create({
      expenditureId,
      beneficiaryId,
      type,
      amount: parseFloat(amount),
      description,
      paymentMethod: paymentMethod || 'bank_transfer',
      referenceNumber,
      createdBy: req.user.id,
      status: 'pending'
    });

    const expenditureWithUser = await Expenditure.findByPk(expenditure.id, {
      include: [
        {
          model: User,
          as: 'beneficiary',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    logger.info(`Expenditure created: ${expenditureId} for ${beneficiary.firstName} ${beneficiary.lastName}, amount: KSh ${amount}, type: ${type}`);

    res.status(201).json({
      success: true,
      message: 'Expenditure created successfully',
      data: {
        expenditure: expenditureWithUser,
      },
    });
  } catch (error) {
    logger.error('Create expenditure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expenditure',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateExpenditure = async (req, res) => {
  try {
    const { expenditureId } = req.params;
    const { status, amount, description, paymentMethod, referenceNumber } = req.body;

    const expenditure = await Expenditure.findByPk(expenditureId);
    if (!expenditure) {
      return res.status(404).json({
        success: false,
        message: 'Expenditure not found',
      });
    }

    const updates = {};
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (description !== undefined) updates.description = description;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (referenceNumber !== undefined) updates.referenceNumber = referenceNumber;

    // Handle status changes
    if (status !== undefined) {
      updates.status = status;
      
      if (status === 'approved') {
        updates.approvedBy = req.user.id;
        updates.approvedAt = new Date();
      } else if (status === 'paid') {
        updates.paidBy = req.user.id;
        updates.paidAt = new Date();
        // If not already approved, auto-approve when paid
        if (expenditure.status === 'pending') {
          updates.approvedBy = req.user.id;
          updates.approvedAt = new Date();
        }
      }
    }

    await expenditure.update(updates);

    const updatedExpenditure = await Expenditure.findByPk(expenditureId, {
      include: [
        {
          model: User,
          as: 'beneficiary',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    logger.info(`Expenditure updated: ${expenditure.expenditureId}, status: ${status || 'no change'}`);

    res.json({
      success: true,
      message: 'Expenditure updated successfully',
      data: {
        expenditure: updatedExpenditure,
      },
    });
  } catch (error) {
    logger.error('Update expenditure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expenditure',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getExpenditureSummary = async (req, res) => {
  try {
    // Get expenditure statistics
    const [
      totalExpenditures,
      pendingExpenditures,
      approvedExpenditures,
      paidExpenditures,
      totalAmountPaid,
      totalAmountPending,
      expendituresByType
    ] = await Promise.all([
      Expenditure.count(),
      Expenditure.count({ where: { status: 'pending' } }),
      Expenditure.count({ where: { status: 'approved' } }),
      Expenditure.count({ where: { status: 'paid' } }),
      Expenditure.sum('amount', { where: { status: 'paid' } }),
      Expenditure.sum('amount', { where: { status: { [Op.in]: ['pending', 'approved'] } } }),
      Expenditure.findAll({
        attributes: [
          'type',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('amount')), 'totalAmount']
        ],
        where: { status: 'paid' },
        group: ['type'],
        raw: true
      })
    ]);

    const summary = {
      totalExpenditures,
      pendingExpenditures,
      approvedExpenditures,
      paidExpenditures,
      totalAmountPaid: parseFloat(totalAmountPaid) || 0,
      totalAmountPending: parseFloat(totalAmountPending) || 0,
      expendituresByType: expendituresByType.reduce((acc, item) => {
        acc[item.type] = {
          count: parseInt(item.count),
          totalAmount: parseFloat(item.totalAmount) || 0
        };
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        summary
      }
    });

  } catch (error) {
    logger.error('Get expenditure summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenditure summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteExpenditure = async (req, res) => {
  try {
    const { expenditureId } = req.params;

    const expenditure = await Expenditure.findByPk(expenditureId);
    if (!expenditure) {
      return res.status(404).json({
        success: false,
        message: 'Expenditure not found',
      });
    }

    // Only allow deletion of pending expenditures
    if (expenditure.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending expenditures can be deleted',
      });
    }

    await expenditure.destroy();

    logger.info(`Expenditure deleted: ${expenditure.expenditureId}`);

    res.json({
      success: true,
      message: 'Expenditure deleted successfully',
    });
  } catch (error) {
    logger.error('Delete expenditure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expenditure',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllExpenditures,
  createExpenditure,
  updateExpenditure,
  getExpenditureSummary,
  deleteExpenditure,
};