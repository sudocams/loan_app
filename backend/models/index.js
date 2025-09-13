const User = require('./User');
const LoanProduct = require('./LoanProduct');
const LoanApplication = require('./LoanApplication');
const Loan = require('./Loan');
const Contribution = require('./Contribution');
const Expenditure = require('./Expenditure');

User.hasMany(LoanApplication, { foreignKey: 'applicantId', as: 'applications' });
User.hasMany(LoanApplication, { foreignKey: 'assignedOfficerId', as: 'assignedApplications' });
User.hasMany(Loan, { foreignKey: 'borrowerId', as: 'loans' });
User.hasMany(Contribution, { foreignKey: 'userId', as: 'contributions' });
User.hasMany(Contribution, { foreignKey: 'recordedBy', as: 'recordedContributions' });

LoanProduct.hasMany(LoanApplication, { foreignKey: 'loanProductId', as: 'applications' });
LoanProduct.hasMany(Loan, { foreignKey: 'loanProductId', as: 'loans' });

LoanApplication.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });
LoanApplication.belongsTo(User, { foreignKey: 'assignedOfficerId', as: 'assignedOfficer' });
LoanApplication.belongsTo(LoanProduct, { foreignKey: 'loanProductId', as: 'loanProduct' });
LoanApplication.hasOne(Loan, { foreignKey: 'applicationId', as: 'loan' });

Loan.belongsTo(User, { foreignKey: 'borrowerId', as: 'borrower' });
Loan.belongsTo(LoanProduct, { foreignKey: 'loanProductId', as: 'loanProduct' });
Loan.belongsTo(LoanApplication, { foreignKey: 'applicationId', as: 'application' });

Contribution.belongsTo(User, { foreignKey: 'userId', as: 'contributor' });
Contribution.belongsTo(User, { foreignKey: 'recordedBy', as: 'recorder' });

// Expenditure associations
User.hasMany(Expenditure, { foreignKey: 'beneficiaryId', as: 'expenditures' });
User.hasMany(Expenditure, { foreignKey: 'createdBy', as: 'createdExpenditures' });
User.hasMany(Expenditure, { foreignKey: 'approvedBy', as: 'approvedExpenditures' });
User.hasMany(Expenditure, { foreignKey: 'paidBy', as: 'paidExpenditures' });

Expenditure.belongsTo(User, { foreignKey: 'beneficiaryId', as: 'beneficiary' });
Expenditure.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Expenditure.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
Expenditure.belongsTo(User, { foreignKey: 'paidBy', as: 'payer' });

module.exports = {
  User,
  LoanProduct,
  LoanApplication,
  Loan,
  Contribution,
  Expenditure
};