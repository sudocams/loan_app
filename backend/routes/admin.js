const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

const {
  getAllExpenditures,
  createExpenditure,
  updateExpenditure,
  getExpenditureSummary,
  deleteExpenditure,
} = require('../controllers/expenditureController');

const router = express.Router();

// All admin routes require authentication and admin/loan_officer role
router.use(auth);
router.use(authorize('admin', 'loan_officer'));

// Dashboard and statistics
router.get('/dashboard', getDashboardStats);
router.get('/financial-metrics', getFinancialMetrics);

// Application management
router.get('/applications', getAllApplications);
router.get('/applications/:id', getApplicationDetails);
router.post('/applications/:id/assign', assignOfficer);
router.post('/applications/:id/review', reviewApplication);

// Loan management
router.get('/loans', getAllLoans);
router.put('/loans/:loanId/payment-status', updateLoanPaymentStatus);

// Loan product management (admin only)
router.post('/loan-products', authorize('admin'), createLoanProduct);
router.put('/loan-products/:id', authorize('admin'), updateLoanProduct);

// User management
router.get('/loan-officers', getLoanOfficers);
router.get('/users', authorize('admin'), getAllUsers);

// Contributions management
router.get('/contributions', getContributions);
router.post('/contributions', createContribution);
router.put('/contributions/:contributionId', updateContribution);

// Expenditures management
router.get('/expenditures/summary', getExpenditureSummary);
router.get('/expenditures', getAllExpenditures);
router.post('/expenditures', createExpenditure);
router.put('/expenditures/:expenditureId', updateExpenditure);
router.delete('/expenditures/:expenditureId', deleteExpenditure);

module.exports = router;