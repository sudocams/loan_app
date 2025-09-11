const express = require('express');
const { auth } = require('../middleware/auth');
const { validateLoanApplication } = require('../middleware/validation');
const { uploadSingle } = require('../middleware/upload');
const {
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
} = require('../controllers/applicationController');

const router = express.Router();

router.use(auth);

router.get('/check-eligibility', checkLoanEligibility);
router.post('/submit-loan', submitLoanApplication);
router.get('/all-loans', getAllLoansForAdmin);
router.post('/', validateLoanApplication, createApplication);
router.get('/my-applications', getUserApplications);
router.get('/:id', getApplication);
router.put('/:id', updateApplication);
router.post('/:id/submit', submitApplication);
router.post('/:id/documents', uploadSingle('document'), uploadDocument);
router.delete('/:id/documents/:docType', deleteDocument);

module.exports = router;