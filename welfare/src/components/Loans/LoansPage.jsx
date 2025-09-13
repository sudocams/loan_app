import { useState } from 'react';
import './LoansPage.css';

const LoansPage = ({ 
  bankBalance, 
  transactions, 
  onNavigate, 
  onProcessLoan, 
  formatCurrency,
  getBalanceStatus,
  canBorrowAgain,
  isLoading 
}) => {
  const [amount, setAmount] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('personal');
  const [loanTerm, setLoanTerm] = useState('short');

  const handleProcessLoan = () => {
    if (!borrowerName.trim()) {
      alert('Please enter borrower name');
      return;
    }
    
    const loanFee = calculateLoanFee(parseFloat(amount));
    onProcessLoan(amount, { 
      purpose: loanPurpose, 
      term: loanTerm, 
      borrowerName: borrowerName.trim(),
      loanFee 
    });
    setAmount('');
    setBorrowerName('');
  };

  const calculateLoanFee = (amount) => {
    if (amount >= 1000 && amount < 5000) return 100;
    if (amount >= 5000 && amount < 10000) return 200;
    if (amount >= 10000 && amount < 15000) return 300;
    if (amount >= 15000 && amount <= 20000) return 500;
    return 0;
  };

  const loanTransactions = transactions.filter(t => t.type === 'loan');
  const totalLoans = loanTransactions.reduce((sum, t) => sum + t.amount, 0);
  const maxLoanLimit = 20000;

  const predefinedAmounts = [5000, 10000, 15000, 20000];
  
  const loanTerms = {
    short: { label: 'Short Term (1-3 months)', rate: 'KSh 100' },
    medium: { label: 'Medium Term (3-6 months)', rate: 'KSh 200' },
    long: { label: 'Long Term (6+ months)', rate: 'KSh 300-500' }
  };

  const loanPurposes = {
    personal: { label: 'Personal Expenses', icon: '🏠' },
    emergency: { label: 'Emergency Fund', icon: '🚨' },
    business: { label: 'Business Investment', icon: '💼' },
    education: { label: 'Education', icon: '🎓' },
    medical: { label: 'Medical Expenses', icon: '🏥' }
  };

  return (
    <div className="loans-page">
      <div className="page-header">
        <h1>🏦 Process Loans</h1>
        <p>Manage your loan transactions and credit</p>
      </div>

      <div className="loans-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Available Balance</h3>
            <p className={`balance-amount status-${getBalanceStatus()}`}>
              {formatCurrency(bankBalance)}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <h3>Loan Limit</h3>
            <p className="credit-amount">
              {formatCurrency(maxLoanLimit)}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Loans</h3>
            <p className="loan-total">
              {formatCurrency(totalLoans)}
            </p>
          </div>
        </div>
      </div>

      {!canBorrowAgain() && (
        <div className="waiting-period-warning">
          <span className="warning-icon">⏰</span>
          <div>
            <h3>Waiting Period Active</h3>
            <p>You must wait one month after clearing your last loan before borrowing again.</p>
          </div>
        </div>
      )}

      {bankBalance < 5000 && (
        <div className="low-balance-warning">
          <span className="warning-icon">⚠️</span>
          <div>
            <h3>Low Balance Warning</h3>
            <p>Your balance is low. Consider making a contribution to increase your available funds.</p>
          </div>
          <button onClick={() => onNavigate('contributions')} className="contribute-link">
            Add Funds
          </button>
        </div>
      )}

      <div className="loan-form-container">
        <div className="loan-form">
          <div className="form-header">
            <h2>Process New Loan</h2>
            <p>Request funds from your available credit</p>
          </div>

          <div className="borrower-name-section">
            <h3>Borrower Information</h3>
            <div className="input-wrapper">
              <input
                type="text"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="Enter borrower's full name"
                className="name-input"
                required
              />
            </div>
          </div>

          <div className="loan-purpose-selector">
            <h3>Loan Purpose</h3>
            <div className="purpose-grid">
              {Object.entries(loanPurposes).map(([key, purpose]) => (
                <label key={key} className="purpose-option">
                  <input
                    type="radio"
                    value={key}
                    checked={loanPurpose === key}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                  />
                  <span className="purpose-label">
                    <span className="purpose-icon">{purpose.icon}</span>
                    {purpose.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="loan-term-selector">
            <h3>Loan Term & Rate</h3>
            <div className="term-options">
              {Object.entries(loanTerms).map(([key, term]) => (
                <label key={key} className="term-option">
                  <input
                    type="radio"
                    value={key}
                    checked={loanTerm === key}
                    onChange={(e) => setLoanTerm(e.target.value)}
                  />
                  <span className="term-label">
                    <div className="term-name">{term.label}</div>
                    <div className="term-rate">Rate: {term.rate}</div>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="quick-amounts">
            <h3>Quick Amounts</h3>
            <div className="amount-grid">
              {predefinedAmounts.map(quickAmount => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`quick-amount-btn ${amount === quickAmount.toString() ? 'selected' : ''} ${!canBorrowAgain() ? 'disabled' : ''}`}
                  disabled={!canBorrowAgain()}
                >
                  {formatCurrency(quickAmount)}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-amount">
            <h3>Custom Amount</h3>
            <div className="input-wrapper">
              <span className="currency-symbol">KSh</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="amount-input"
                step="100"
                min="1000"
                max={maxLoanLimit}
                disabled={!canBorrowAgain()}
              />
            </div>
            {amount && (parseFloat(amount) > maxLoanLimit || parseFloat(amount) < 1000) && (
              <div className="warning-message">
                ⚠️ Loan amount must be between KSh 1,000 and KSh 20,000
              </div>
            )}
          </div>

          <div className="loan-summary">
            <div className="summary-row">
              <span>Borrower Name:</span>
              <span className="summary-name">
                {borrowerName || 'Not specified'}
              </span>
            </div>
            <div className="summary-row">
              <span>Loan Amount:</span>
              <span className="summary-amount">
                {amount ? formatCurrency(parseFloat(amount)) : formatCurrency(0)}
              </span>
            </div>
            <div className="summary-row">
              <span>Loan Fee:</span>
              <span className="summary-fee">
                {amount ? formatCurrency(calculateLoanFee(parseFloat(amount))) : formatCurrency(0)}
              </span>
            </div>
            <div className="summary-row">
              <span>Remaining Balance:</span>
              <span className="summary-balance">
                {amount ? formatCurrency(bankBalance - parseFloat(amount)) : formatCurrency(bankBalance)}
              </span>
            </div>
          </div>

          <button 
            onClick={handleProcessLoan}
            className="loan-btn"
            disabled={isLoading || !amount || !borrowerName.trim() || parseFloat(amount) < 1000 || parseFloat(amount) > maxLoanLimit || !canBorrowAgain()}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <span className="btn-icon">💳</span>
                Process Loan
              </>
            )}
          </button>
        </div>

        <div className="loan-info">
          <h3>📋 Loan Information</h3>
          
          <div className="info-section">
            <h4>Loan Limits</h4>
            <p>Maximum loan amount: <strong>{formatCurrency(maxLoanLimit)}</strong></p>
            <p>Minimum loan amount: <strong>KSh 1,000</strong></p>
          </div>

          <div className="info-section">
            <h4>Loan Charges</h4>
            <ul>
              <li><strong>KSh 1,000 - 4,999:</strong> KSh 100 fee</li>
              <li><strong>KSh 5,000 - 9,999:</strong> KSh 200 fee</li>
              <li><strong>KSh 10,000 - 14,999:</strong> KSh 300 fee</li>
              <li><strong>KSh 15,000 - 20,000:</strong> KSh 500 fee</li>
            </ul>
          </div>

          <div className="info-section">
            <h4>Loan Requirements</h4>
            <ul>
              <li>Minimum loan: KSh 1,000</li>
              <li>Maximum loan: KSh 20,000</li>
              <li>Must wait 1 month after clearing last loan</li>
              <li>Instant processing</li>
              <li>No prepayment penalties</li>
            </ul>
          </div>

          <div className="info-section">
            <h4>💡 Loan Tips</h4>
            <div className="tip-item">
              <span className="tip-icon">💡</span>
              <p>Choose longer terms for lower interest rates</p>
            </div>
            <div className="tip-item">
              <span className="tip-icon">📊</span>
              <p>Monitor your balance to maintain good credit</p>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🎯</span>
              <p>Only borrow what you need</p>
            </div>
          </div>
        </div>
      </div>

      <div className="loan-history">
        <div className="section-header">
          <h2>📋 Loan Records</h2>
          <span className="history-count">{loanTransactions.length} loans</span>
        </div>
        
        {loanTransactions.length === 0 ? (
          <div className="no-loans">
            <span className="empty-icon">🏦</span>
            <p>No loans processed yet</p>
            <small>Your loan records will appear here</small>
          </div>
        ) : (
          <div className="loan-table-container">
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Borrower Name</th>
                  <th>Date Taken</th>
                  <th>Loan Amount</th>
                  <th>Loan Fee</th>
                  <th>Purpose</th>
                  <th>Term</th>
                </tr>
              </thead>
              <tbody>
                {loanTransactions.map(transaction => (
                  <tr key={transaction.id} className="loan-row">
                    <td className="borrower-name">
                      <div className="borrower-info">
                        <span className="borrower-icon">👤</span>
                        {transaction.metadata?.borrowerName || 'Unknown'}
                      </div>
                    </td>
                    <td className="loan-date">
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </td>
                    <td className="loan-amount">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="loan-fee">
                      {transaction.metadata?.loanFee ? formatCurrency(transaction.metadata.loanFee) : 'N/A'}
                    </td>
                    <td className="loan-purpose">
                      <span className="purpose-badge">
                        {loanPurposes[transaction.metadata?.purpose]?.icon || '💼'} 
                        {loanPurposes[transaction.metadata?.purpose]?.label || 'Personal'}
                      </span>
                    </td>
                    <td className="loan-term">
                      <span className="term-badge">
                        {loanTerms[transaction.metadata?.term]?.label?.split(' ')[0] || 'Short'} Term
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoansPage;