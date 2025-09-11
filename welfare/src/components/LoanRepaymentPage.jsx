import { useState } from 'react';
import './LoanRepaymentPage.css';

const LoanRepaymentPage = ({ 
  transactions, 
  onRepayLoan,
  formatCurrency,
  isLoading 
}) => {
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [repayerName, setRepayerName] = useState('');

  const activeLoans = transactions.filter(t => t.type === 'loan' && !t.cleared);
  const repaymentHistory = transactions.filter(t => t.type === 'repayment');

  const calculateTotalOwed = (loan) => {
    return loan.amount + (loan.metadata?.loanFee || 0);
  };

  const calculateRemainingBalance = (loan) => {
    const totalOwed = calculateTotalOwed(loan);
    const repayments = repaymentHistory
      .filter(r => r.metadata?.loanId === loan.id)
      .reduce((sum, r) => sum + r.amount, 0);
    return Math.max(0, totalOwed - repayments);
  };

  const handleRepayment = () => {
    if (!selectedLoanId || !repaymentAmount || !repayerName.trim()) {
      alert('Please fill all required fields');
      return;
    }

    const loan = activeLoans.find(l => l.id.toString() === selectedLoanId);
    if (!loan) return;

    const remainingBalance = calculateRemainingBalance(loan);
    const payment = parseFloat(repaymentAmount);

    if (payment <= 0) {
      alert('Please enter a valid repayment amount');
      return;
    }

    if (payment > remainingBalance) {
      alert(`Payment cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`);
      return;
    }

    onRepayLoan(selectedLoanId, payment, repayerName.trim());
    setSelectedLoanId('');
    setRepaymentAmount('');
    setRepayerName('');
  };

  const totalRepayments = repaymentHistory.reduce((sum, r) => sum + r.amount, 0);
  const totalOutstanding = activeLoans.reduce((sum, loan) => sum + calculateRemainingBalance(loan), 0);

  return (
    <div className="loan-repayment-page">
      <div className="page-header">
        <h1>💳 Loan Repayments</h1>
        <p>Process loan repayments and track payment history</p>
      </div>

      <div className="repayment-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Repayments</h3>
            <p className="repayment-amount">
              {formatCurrency(totalRepayments)}
            </p>
            <small>{repaymentHistory.length} repayments made</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Outstanding Balance</h3>
            <p className="outstanding-amount">
              {formatCurrency(totalOutstanding)}
            </p>
            <small>{activeLoans.length} active loans</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Repayment Rate</h3>
            <p className="repayment-rate">
              {totalRepayments + totalOutstanding > 0 ? 
                Math.round((totalRepayments / (totalRepayments + totalOutstanding)) * 100) : 0}%
            </p>
            <small>of total loan amount</small>
          </div>
        </div>
      </div>

      <div className="repayment-form-container">
        <div className="repayment-form">
          <div className="form-header">
            <h2>Process Loan Repayment</h2>
            <p>Record a loan repayment from a member</p>
          </div>

          {activeLoans.length === 0 ? (
            <div className="no-active-loans">
              <span className="empty-icon">🎉</span>
              <p>No active loans to repay</p>
              <small>All loans have been fully repaid</small>
            </div>
          ) : (
            <>
              <div className="repayer-name-section">
                <h3>Repayer Information</h3>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={repayerName}
                    onChange={(e) => setRepayerName(e.target.value)}
                    placeholder="Enter repayer's full name"
                    className="name-input"
                    required
                  />
                </div>
              </div>

              <div className="loan-selection">
                <h3>Select Loan to Repay</h3>
                <select
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  className="loan-select"
                >
                  <option value="">Choose a loan...</option>
                  {activeLoans.map(loan => (
                    <option key={loan.id} value={loan.id}>
                      {loan.metadata?.borrowerName || 'Unknown'} - Balance: {formatCurrency(calculateRemainingBalance(loan))}
                    </option>
                  ))}
                </select>
              </div>

              {selectedLoanId && (
                <div className="selected-loan-details">
                  <h3>Loan Details</h3>
                  {(() => {
                    const loan = activeLoans.find(l => l.id.toString() === selectedLoanId);
                    if (!loan) return null;
                    const totalOwed = calculateTotalOwed(loan);
                    const remainingBalance = calculateRemainingBalance(loan);
                    const paidAmount = totalOwed - remainingBalance;
                    
                    return (
                      <div className="loan-details-card">
                        <div className="detail-row">
                          <span>Borrower:</span>
                          <span>{loan.metadata?.borrowerName || 'Unknown'}</span>
                        </div>
                        <div className="detail-row">
                          <span>Original Amount:</span>
                          <span>{formatCurrency(loan.amount)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Loan Fee:</span>
                          <span>{formatCurrency(loan.metadata?.loanFee || 0)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Total Owed:</span>
                          <span>{formatCurrency(totalOwed)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Amount Paid:</span>
                          <span className="paid-amount">{formatCurrency(paidAmount)}</span>
                        </div>
                        <div className="detail-row total-row">
                          <span>Remaining Balance:</span>
                          <span className="remaining-amount">{formatCurrency(remainingBalance)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="repayment-amount-section">
                <h3>Repayment Amount</h3>
                <div className="input-wrapper">
                  <span className="currency-symbol">KSh</span>
                  <input
                    type="number"
                    value={repaymentAmount}
                    onChange={(e) => setRepaymentAmount(e.target.value)}
                    placeholder="Enter repayment amount"
                    className="amount-input"
                    step="100"
                    min="0"
                  />
                </div>
                {selectedLoanId && repaymentAmount && (() => {
                  const loan = activeLoans.find(l => l.id.toString() === selectedLoanId);
                  if (!loan) return null;
                  const remainingBalance = calculateRemainingBalance(loan);
                  const payment = parseFloat(repaymentAmount);
                  
                  if (payment > remainingBalance) {
                    return (
                      <div className="warning-message">
                        ⚠️ Payment exceeds remaining balance of {formatCurrency(remainingBalance)}
                      </div>
                    );
                  } else if (payment === remainingBalance) {
                    return (
                      <div className="success-message">
                        ✅ This payment will fully settle the loan
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <button 
                onClick={handleRepayment}
                className="repayment-btn"
                disabled={isLoading || !selectedLoanId || !repaymentAmount || !repayerName.trim()}
              >
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    <span className="btn-icon">💳</span>
                    Record Repayment
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Repayment History Table */}
      <div className="repayment-history-section">
        <div className="section-header">
          <h2>📋 Repayment History</h2>
          <span className="history-count">{repaymentHistory.length} repayments</span>
        </div>
        
        {repaymentHistory.length === 0 ? (
          <div className="no-repayments">
            <span className="empty-icon">📋</span>
            <p>No repayments recorded yet</p>
            <small>Repayment history will appear here</small>
          </div>
        ) : (
          <div className="repayments-table-container">
            <table className="repayments-table">
              <thead>
                <tr>
                  <th>Repayer Name</th>
                  <th>Borrower</th>
                  <th>Repayment Amount</th>
                  <th>Loan Balance After</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {repaymentHistory.slice().reverse().map(repayment => {
                  const loan = transactions.find(t => t.id === repayment.metadata?.loanId);
                  return (
                    <tr key={repayment.id} className="repayment-row">
                      <td className="repayer-name">
                        <div className="repayer-info">
                          <span className="repayer-icon">👤</span>
                          {repayment.metadata?.repayerName || 'Unknown'}
                        </div>
                      </td>
                      <td className="borrower-name">
                        {loan?.metadata?.borrowerName || 'Unknown'}
                      </td>
                      <td className="repayment-amount">
                        {formatCurrency(repayment.amount)}
                      </td>
                      <td className="loan-balance">
                        {loan ? formatCurrency(calculateRemainingBalance(loan)) : 'N/A'}
                      </td>
                      <td className="repayment-date">
                        {new Date(repayment.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanRepaymentPage;