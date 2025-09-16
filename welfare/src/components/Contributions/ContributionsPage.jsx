import { useState } from 'react';
import './ContributionsPage.css';

const ContributionsPage = ({ 
  bankBalance, 
  transactions, 
  onContribute, 
  formatCurrency,
  getBalanceStatus,
  isLoading 
}) => {
  const [amount, setAmount] = useState('1000');
  const [contributorName, setContributorName] = useState('');

  const handleContribute = () => {
    if (!contributorName.trim()) {
      alert('Please enter contributor name');
      return;
    }
    onContribute(amount, { type: 'monthly', contributorName: contributorName.trim() });
    setAmount('1000');
    setContributorName('');
  };

  const contributionTransactions = transactions.filter(t => t.type === 'contribution');
  const totalContributions = contributionTransactions.reduce((sum, t) => sum + t.amount, 0);
  const averageContribution = contributionTransactions.length > 0 
    ? totalContributions / contributionTransactions.length 
    : 0;

  const predefinedAmounts = [1000, 2500, 5000, 10000, 25000];

  return (
    <div className="contributions-page">
      <div className="page-header">
        <h1>💵 Monthly Contributions</h1>
        <p>Add funds to grow your account balance</p>
      </div>

      <div className="contributions-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Current Balance</h3>
            <p className={`balance-amount status-${getBalanceStatus()}`}>
              {formatCurrency(bankBalance)}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Contributions</h3>
            <p className="contribution-total">
              {formatCurrency(totalContributions)}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Average Contribution</h3>
            <p className="average-amount">
              {formatCurrency(averageContribution)}
            </p>
          </div>
        </div>
      </div>

      <div className="contribution-form-container">
        <div className="contribution-form">
          <div className="form-header">
            <h2>Make a Contribution</h2>
            <p>Choose an amount to add to your account</p>
          </div>

          <div className="contributor-name-section">
            <h3>Contributor Information</h3>
            <div className="input-wrapper">
              <input
                type="text"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="Enter contributor's full name"
                className="name-input"
                required
              />
            </div>
          </div>

          <div className="contribution-type-info">
            <div className="type-info-card">
              {/* <span className="type-icon">📅</span> */}
              <div>
                <h4>Monthly Contribution</h4>
                <p>Standard monthly contribution of KSh 1,000 per member</p>
              </div>
            </div>
          </div>

          <div className="quick-amounts">
            <h3>Quick Amounts</h3>
            <div className="amount-grid">
              {predefinedAmounts.map(quickAmount => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`quick-amount-btn ${amount === quickAmount.toString() ? 'selected' : ''}`}
                >
                  {formatCurrency(quickAmount)}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-amount">
            <h3>Custom Amount</h3>
            <div className="input-wrapper">
              {/* <span className="currency-symbol">KSh</span> */}
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="amount-input"
                step="100"
                min="0"
              />
            </div>
          </div>

          <div className="contribution-summary">
            <div className="summary-row">
              <span>Contribution Amount:</span>
              <span className="summary-amount">
                {amount ? formatCurrency(parseFloat(amount)) : formatCurrency(0)}
              </span>
            </div>
            <div className="summary-row">
              <span>New Balance:</span>
              <span className="summary-balance">
                {amount ? formatCurrency(bankBalance + parseFloat(amount)) : formatCurrency(bankBalance)}
              </span>
            </div>
          </div>

          <button 
            onClick={handleContribute}
            className="contribute-btn"
            disabled={isLoading || !amount || !contributorName.trim() || parseFloat(amount) <= 0}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <span className="btn-icon">+</span>
                Add Monthly Contribution
              </>
            )}
          </button>
        </div>

        <div className="contribution-tips">
          <h3>💡 Contribution Tips</h3>
          <div className="tip-item">
            <span className="tip-icon">🎯</span>
            <div>
              <h4>Set a Goal</h4>
              <p>Regular monthly contributions help build your balance steadily</p>
            </div>
          </div>
          <div className="tip-item">
            <span className="tip-icon">📊</span>
            <div>
              <h4>Track Progress</h4>
              <p>Monitor your contribution history to see your financial growth</p>
            </div>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🏆</span>
            <div>
              <h4>Stay Consistent</h4>
              <p>Small, regular contributions add up to significant savings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="contribution-history">
        <div className="section-header">
          <h2>📋 Contribution History</h2>
          <span className="history-count">{contributionTransactions.length} contributions</span>
        </div>
        <div className="history-list">
          {contributionTransactions.length === 0 ? (
            <div className="no-contributions">
              <span className="empty-icon">💰</span>
              <p>No contributions yet</p>
              <small>Start by making your first contribution above</small>
            </div>
          ) : (
            contributionTransactions.map(transaction => (
              <div key={transaction.id} className="history-item">
                <div className="contribution-info">
                  <div className="contribution-details">
                    <span className="contribution-icon">💰</span>
                    <div>
                      <div className="contribution-amount">
                        +{formatCurrency(transaction.amount)}
                      </div>
                      <div className="contribution-date">{transaction.timestamp}</div>
                    </div>
                  </div>
                  <div className="balance-after">
                    Balance: {formatCurrency(transaction.balance)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContributionsPage;