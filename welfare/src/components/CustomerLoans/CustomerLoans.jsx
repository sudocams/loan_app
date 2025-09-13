import { useState, useEffect } from 'react';
import { loanService } from '../../services/loanService';
import './CustomerLoans.css';

const CustomerLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await loanService.getUserLoans({ limit: 50 });
      if (response.success) {
        setLoans(response.data.loans);
      } else {
        setError('Failed to fetch loans');
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      setError('Error loading loans');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { color: 'blue', label: 'Active', icon: '🔵' },
      'paid': { color: 'green', label: 'Paid', icon: '✅' },
      'paid_off': { color: 'green', label: 'Paid Off', icon: '✅' },
      'overdue': { color: 'red', label: 'Overdue', icon: '⚠️' },
      'defaulted': { color: 'dark-red', label: 'Defaulted', icon: '❌' }
    };
    
    const statusInfo = statusMap[status] || { color: 'gray', label: status, icon: '⚪' };
    
    return (
      <span className={`status-badge status-${statusInfo.color}`}>
        {statusInfo.icon} {statusInfo.label}
      </span>
    );
  };

  const getPaymentProgress = (loan) => {
    if (loan.status === 'paid' || loan.status === 'paid_off') {
      return 100;
    }
    
    if (!loan.principalAmount || loan.principalAmount === 0) {
      return 0;
    }
    
    const amountPaid = loan.amountPaid || 0;
    return Math.max(0, Math.min(100, (amountPaid / loan.principalAmount) * 100));
  };

  const filteredLoans = loans.filter(loan => {
    if (filterStatus === 'all') return true;
    return loan.status === filterStatus;
  });

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalBorrowed = loans.reduce((sum, loan) => sum + (loan.principalAmount || 0), 0);
  const totalBalance = loans.reduce((sum, loan) => sum + (loan.currentBalance || 0), 0);
  const totalPaid = loans.reduce((sum, loan) => sum + (loan.amountPaid || 0), 0);

  if (loading) {
    return (
      <div className="customer-loans-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your loans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-loans-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchLoans} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-loans-container">
      <div className="page-header">
        <h1>💳 My Loans</h1>
        <p>Manage and track your loan payments</p>
      </div>

      <div className="loans-summary">
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>Total Borrowed</h3>
            <p className="summary-amount">{formatCurrency(totalBorrowed)}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">💳</div>
          <div className="summary-content">
            <h3>Outstanding Balance</h3>
            <p className="summary-amount">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <h3>Total Paid</h3>
            <p className="summary-amount">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <h3>Active Loans</h3>
            <p className="summary-count">{loans.filter(l => l.status === 'active').length}</p>
          </div>
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Loans</option>
            <option value="active">Active</option>
            <option value="paid">Paid</option>
            <option value="paid_off">Paid Off</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <button onClick={fetchLoans} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {sortedLoans.length === 0 ? (
        <div className="no-loans">
          <div className="empty-icon">💳</div>
          <h3>No Loans Found</h3>
          <p>You don't have any loans yet. Apply for a loan to get started!</p>
          <button 
            onClick={() => window.location.href = '/apply'} 
            className="apply-button"
          >
            Apply for Loan
          </button>
        </div>
      ) : (
        <div className="loans-grid">
          {sortedLoans.map((loan) => (
            <div key={loan.id} className="loan-card">
              <div className="loan-header">
                <div className="loan-id">
                  <span className="loan-label">Loan</span>
                  <span className="loan-number">#{loan.loanId || `L${loan.id}`}</span>
                </div>
                <div className="loan-status">
                  {getStatusBadge(loan.status)}
                </div>
              </div>

              <div className="loan-details">
                <div className="detail-row">
                  <span className="detail-label">Principal Amount:</span>
                  <span className="detail-value amount">{formatCurrency(loan.principalAmount)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Amount Paid:</span>
                  <span className="detail-value amount-paid">
                    {formatCurrency(loan.amountPaid || 0)}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Current Balance:</span>
                  <span className="detail-value balance">
                    {formatCurrency(loan.currentBalance || 0)}
                  </span>
                </div>
                
                {loan.processingFees && (
                  <div className="detail-row">
                    <span className="detail-label">Processing Fee:</span>
                    <span className="detail-value fee">{formatCurrency(parseFloat(loan.processingFees) || 0)}</span>
                  </div>
                )}
                
                <div className="detail-row">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{formatDate(loan.startDate)}</span>
                </div>
                
                {(loan.status === 'paid' || loan.status === 'paid_off') && loan.paidAt && (
                  <div className="detail-row">
                    <span className="detail-label">Paid Date:</span>
                    <span className="detail-value paid-date">{formatDate(loan.paidAt)}</span>
                  </div>
                )}
                
                {loan.maturityDate && (
                  <div className="detail-row">
                    <span className="detail-label">Maturity Date:</span>
                    <span className="detail-value">{formatDate(loan.maturityDate)}</span>
                  </div>
                )}
              </div>

              {loan.status !== 'paid' && loan.status !== 'paid_off' && (
                <div className="payment-progress">
                  <div className="progress-header">
                    <span className="progress-label">Payment Progress</span>
                    <span className="progress-percentage">{Math.round(getPaymentProgress(loan))}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${getPaymentProgress(loan)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {loan.status === 'paid' || loan.status === 'paid_off' ? (
                <div className="loan-footer paid">
                  <span className="paid-indicator">🎉 Loan Fully Paid!</span>
                </div>
              ) : (
                <div className="loan-footer active">
                  <span className="remaining-balance">
                    Remaining: {formatCurrency(loan.currentBalance || 0)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerLoans;