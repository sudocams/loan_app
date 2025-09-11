const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getLoanProducts,
  getLoanProduct,
  calculateLoanTerms,
  getUserLoans,
  getLoanDetails,
  makePayment,
  getPaymentHistory,
} = require('../controllers/loanController');

const router = express.Router();

router.get('/products', getLoanProducts);
router.get('/products/:id', getLoanProduct);
router.post('/calculate', calculateLoanTerms);

router.use(auth);

router.get('/my-loans', getUserLoans);
router.get('/my-loans/:id', getLoanDetails);
router.post('/my-loans/:id/payments', makePayment);
router.get('/my-loans/:id/payments', getPaymentHistory);

module.exports = router;