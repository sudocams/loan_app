const User = require('./User');
const LoanProduct = require('./LoanProduct');
const LoanApplication = require('./LoanApplication');
const Loan = require('./Loan');

User.hasMany(LoanApplication, { foreignKey: 'applicantId', as: 'applications' });
User.hasMany(LoanApplication, { foreignKey: 'assignedOfficerId', as: 'assignedApplications' });
User.hasMany(Loan, { foreignKey: 'borrowerId', as: 'loans' });

LoanProduct.hasMany(LoanApplication, { foreignKey: 'loanProductId', as: 'applications' });
LoanProduct.hasMany(Loan, { foreignKey: 'loanProductId', as: 'loans' });

LoanApplication.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });
LoanApplication.belongsTo(User, { foreignKey: 'assignedOfficerId', as: 'assignedOfficer' });
LoanApplication.belongsTo(LoanProduct, { foreignKey: 'loanProductId', as: 'loanProduct' });
LoanApplication.hasOne(Loan, { foreignKey: 'applicationId', as: 'loan' });

Loan.belongsTo(User, { foreignKey: 'borrowerId', as: 'borrower' });
Loan.belongsTo(LoanProduct, { foreignKey: 'loanProductId', as: 'loanProduct' });
Loan.belongsTo(LoanApplication, { foreignKey: 'applicationId', as: 'application' });

module.exports = {
  User,
  LoanProduct,
  LoanApplication,
  Loan
};