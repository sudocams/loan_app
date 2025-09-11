const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

const validateRegister = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password'),
  
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors,
];

const validateLoanApplication = [
  body('loanProduct')
    .isMongoId()
    .withMessage('Valid loan product ID is required'),
  
  body('requestedAmount')
    .isNumeric()
    .withMessage('Requested amount must be a number')
    .custom((value) => {
      if (value < 1000) {
        throw new Error('Minimum loan amount is $1,000');
      }
      return true;
    }),
  
  body('requestedTerm')
    .isInt({ min: 6, max: 360 })
    .withMessage('Loan term must be between 6 and 360 months'),
  
  body('purpose')
    .isIn(['debt_consolidation', 'home_improvement', 'major_purchase', 'medical', 'vacation', 'business', 'education', 'other'])
    .withMessage('Please select a valid loan purpose'),
  
  body('financialInfo.annualIncome')
    .isNumeric()
    .withMessage('Annual income must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Annual income cannot be negative');
      }
      return true;
    }),
  
  body('financialInfo.monthlyExpenses')
    .isNumeric()
    .withMessage('Monthly expenses must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Monthly expenses cannot be negative');
      }
      return true;
    }),
  
  handleValidationErrors,
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-\(\)]{10,}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address.street')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Street address cannot be empty'),
  
  body('address.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  
  body('address.state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('State cannot be empty'),
  
  body('address.zipCode')
    .optional()
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid ZIP code'),
  
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateLoanApplication,
  validateUserUpdate,
  handleValidationErrors,
};