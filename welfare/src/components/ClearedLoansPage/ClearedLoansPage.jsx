import './ClearedLoansPage.css';

const ClearedLoansPage = ({ 
  transactions, 
  formatCurrency
}) => {
  const activeLoans = transactions.filter(t => t.type === 'loan' && !t.cleared);
  const clearedLoans = transactions.filter(t => t.type === 'loan' && t.cleared);
  
  const totalActiveAmount = activeLoans.reduce((sum, loan) => sum + loan.amount + (loan.metadata?.loanFee || 0), 0);
  const totalClearedAmount = clearedLoans.reduce((sum, loan) => sum + loan.amount + (loan.metadata?.loanFee || 0), 0);

  const calculateTotalOwed = (loan) => {
    return loan.amount + (loan.metadata?.loanFee || 0);
  };

  const calculateRemainingBalance = (loan) => {
    const totalOwed = calculateTotalOwed(loan);
    const amountPaid = loan.amountPaid || 0;
    return Math.max(0, totalOwed - amountPaid);
  };

  return (
    <div className="cleared-loans-page">
      <div className="page-header">
        <h1>📋 Loan Status Overview</h1>
        <p>Track cleared and outstanding loans</p>
      </div>

      <div className="loans-stats">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Cleared Loans</h3>
            <p className="cleared-loans-amount">
              {formatCurrency(totalClearedAmount)}
            </p>
            <small>{clearedLoans.length} loans cleared</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Outstanding Loans</h3>
            <p className="active-loans-amount">
              {formatCurrency(totalActiveAmount)}
            </p>
            <small>{activeLoans.length} loans pending</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Loans</h3>
            <p className="total-loans-amount">
              {formatCurrency(totalActiveAmount + totalClearedAmount)}
            </p>
            <small>{activeLoans.length + clearedLoans.length} total loans</small>
          </div>
        </div>
      </div>


      {/* Outstanding Loans Table */}
      <div className="outstanding-loans-section">
        <div className="section-header">
          <h2>⏳ Outstanding Loans</h2>
          <span className="loans-count">{activeLoans.length} outstanding</span>
        </div>
        
        {activeLoans.length === 0 ? (
          <div className="no-loans">
            <span className="empty-icon">🎉</span>
            <p>No outstanding loans</p>
            <small>All loans have been cleared</small>
          </div>
        ) : (
          <div className="loans-table-container">
            <table className="loans-table">
              <thead>
                <tr>
                  <th>Borrower Name</th>
                  <th>Date Taken</th>
                  <th>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map(loan => (
                  <tr key={loan.id} className="loan-row outstanding">
                    <td className="borrower-name">
                      <div className="borrower-info">
                        <span className="borrower-icon">👤</span>
                        {loan.metadata?.borrowerName || 'Unknown'}
                      </div>
                    </td>
                    <td className="loan-date">
                      {new Date(loan.timestamp).toLocaleDateString()}
                    </td>
                    <td className="remaining-balance">
                      {formatCurrency(calculateRemainingBalance(loan))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cleared Loans Table */}
      <div className="cleared-loans-section">
        <div className="section-header">
          <h2>✅ Cleared Loans</h2>
          <span className="loans-count">{clearedLoans.length} cleared</span>
        </div>
        
        {clearedLoans.length === 0 ? (
          <div className="no-loans">
            <span className="empty-icon">📋</span>
            <p>No cleared loans yet</p>
            <small>Cleared loans will appear here</small>
          </div>
        ) : (
          <div className="loans-table-container">
            <table className="loans-table">
              <thead>
                <tr>
                  <th>Borrower Name</th>
                  <th>Amount Cleared</th>
                </tr>
              </thead>
              <tbody>
                {clearedLoans.map(loan => (
                  <tr key={loan.id} className="loan-row cleared">
                    <td className="borrower-name">
                      <div className="borrower-info">
                        <span className="borrower-icon">✅</span>
                        {loan.metadata?.borrowerName || 'Unknown'}
                      </div>
                    </td>
                    <td className="amount-cleared">
                      {formatCurrency(loan.amountPaid || calculateTotalOwed(loan))}
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

export default ClearedLoansPage;