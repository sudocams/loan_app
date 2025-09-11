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
} = require('../controllers/adminController');

const router = express.Router();

router.use(auth);

router.get('/dashboard', authorize('admin', 'loan_officer'), getDashboardStats);

router.get('/applications', authorize('admin', 'loan_officer'), getAllApplications);
router.get('/applications/:id', authorize('admin', 'loan_officer'), getApplicationDetails);
router.put('/applications/:id/assign', authorize('admin', 'loan_officer'), assignOfficer);
router.put('/applications/:id/review', authorize('admin', 'loan_officer'), reviewApplication);

router.post('/loan-products', authorize('admin'), createLoanProduct);
router.put('/loan-products/:id', authorize('admin'), updateLoanProduct);

router.get('/loans', authorize('admin', 'loan_officer'), getAllLoans);
router.get('/officers', authorize('admin', 'loan_officer'), getLoanOfficers);

module.exports = router;