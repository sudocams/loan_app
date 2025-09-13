import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import './AdminLoanManagement.css';

const AdminLoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [financialMetrics, setFinancialMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingLoan, setUpdatingLoan] = useState(null);
  const [paymentAmounts, setPaymentAmounts] = useState({});

  useEffect(() => {
    fetchLoans();
    fetchFinancialMetrics();
  }, []);

  const fetchFinancialMetrics = async () => {
    try {
      console.log('Admin Loan Management: Fetching financial metrics...');
      const response = await adminService.getFinancialMetrics();
      
      if (response?.success) {
        setFinancialMetrics(response.data?.metrics || {});
        console.log('Admin Loan Management: Financial metrics loaded');
      } else {
        console.error('Admin Loan Management: Failed to load financial metrics:', response?.message);
      }
    } catch (error) {
      console.error('Admin Loan Management: Error fetching financial metrics:', error);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Admin Loan Management: Fetching loans...');
      
      const response = await adminService.getAllLoans({ limit: 100 });
      console.log('Admin Loan Management: API response:', response);
      
      if (response?.success) {
        const loansData = response.data?.loans || [];
        setLoans(loansData);
        console.log('Admin Loan Management: Successfully loaded', loansData.length, 'loans');
        console.log('Admin Loan Management: Sample loan data:', loansData[0]);
      } else {
        const errorMessage = response?.message || 'Failed to fetch loans';
        setError(errorMessage);
        console.error('Admin Loan Management: API error:', errorMessage);
        console.error('Admin Loan Management: Full response:', response);
      }
    } catch (error) {
      console.error('Admin Loan Management: Network/Request error:', error);
      console.error('Admin Loan Management: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      setError(`Network error: ${error.message}. Please check your connection and try again.`);
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

  const handleUpdatePaymentStatus = async (loanId, isPaid) => {
    try {
      setUpdatingLoan(loanId);
      await adminService.updateLoanPaymentStatus(loanId, isPaid);
      await fetchLoans(); // Refresh the table
      setUpdatingLoan(null);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError('Failed to update payment status');
      setUpdatingLoan(null);
    }
  };

  const handleUpdateAmountPaid = async (loanId) => {
    const amountPaid = paymentAmounts[loanId];
    if (amountPaid === undefined || amountPaid === '') {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setUpdatingLoan(loanId);
      await adminService.updateLoanAmountPaid(loanId, parseFloat(amountPaid));
      await fetchLoans(); // Refresh the table
      setUpdatingLoan(null);
      // Clear the input field
      setPaymentAmounts(prev => ({ ...prev, [loanId]: '' }));
    } catch (error) {
      console.error('Error updating payment amount:', error);
      setError('Failed to update payment amount');
      setUpdatingLoan(null);
    }
  };

  const handlePaymentAmountChange = (loanId, value) => {
    setPaymentAmounts(prev => ({ ...prev, [loanId]: value }));
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
      'active': { color: 'blue', label: 'Active' },
      'paid': { color: 'green', label: 'Paid' },
      'overdue': { color: 'red', label: 'Overdue' },
      'defaulted': { color: 'dark-red', label: 'Defaulted' }
    };
    
    const statusInfo = statusMap[status] || { color: 'gray', label: status };
    
    return (
      <span className={`status-badge status-${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const filteredLoans = loans.filter(loan => {
    if (filterStatus === 'all') return true;
    return loan.status === filterStatus;
  });

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'borrower') {
      aValue = `${a.borrower?.firstName || ''} ${a.borrower?.lastName || ''}`.trim();
      bValue = `${b.borrower?.firstName || ''} ${b.borrower?.lastName || ''}`.trim();
    }
    
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

  if (loading) {
    return (
      <div className="loan-management-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading loans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loan-management-container">
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
    <div className="loan-management-container">
      <div className="page-header">
        <h1>🏦 Loan Management</h1>
        <p>Manage all active loans and payment statuses</p>
      </div>

      {/* Financial Metrics Overview */}
      <div className="financial-overview">
        <h2>💼 Financial Overview</h2>
        <div className="financial-metrics-grid">
          <div className="metric-card primary">
            <div className="metric-icon">💳</div>
            <div className="metric-content">
              <h3>Total Contributions</h3>
              <p className="metric-number">{formatCurrency(financialMetrics.totalContributions)}</p>
              <small>{financialMetrics.totalContributionsCount || 0} contributions</small>
            </div>
          </div>
          
          <div className="metric-card success">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <h3>Collected Loan Fees</h3>
              <p className="metric-number">{formatCurrency(financialMetrics.totalCollectedLoanFees)}</p>
              <small>Processing fees</small>
            </div>
          </div>
          
          <div className="metric-card danger">
            <div className="metric-icon">⚠️</div>
            <div className="metric-content">
              <h3>Outstanding Loans</h3>
              <p className="metric-number">{formatCurrency(financialMetrics.outstandingLoans)}</p>
              <small>{financialMetrics.activeLoansCount || 0} active loans</small>
            </div>
          </div>
          
          <div className="metric-card highlight">
            <div className="metric-icon">🏧</div>
            <div className="metric-content">
              <h3>Current Bank Balance</h3>
              <p className="metric-number">{formatCurrency(financialMetrics.currentBankBalance)}</p>
              <small>Total organization balance</small>
            </div>
          </div>
        </div>
      </div>

      <div className="loans-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Loans</h3>
            <p className="stat-number">{loans.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔵</div>
          <div className="stat-content">
            <h3>Active</h3>
            <p className="stat-number">{loans.filter(l => l.status === 'active').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Paid</h3>
            <p className="stat-number">{loans.filter(l => l.status === 'paid').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Outstanding</h3>
            <p className="stat-number">
              {formatCurrency(loans.filter(l => l.status === 'active').reduce((sum, loan) => sum + (loan.currentBalance || 0), 0))}
            </p>
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
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <button onClick={fetchLoans} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      <div className="table-container">
        <table className="loans-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('loanId')} className="sortable">
                Loan ID {sortBy === 'loanId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('borrower')} className="sortable">
                Customer {sortBy === 'borrower' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('principalAmount')} className="sortable">
                Principal {sortBy === 'principalAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('amountPaid')} className="sortable">
                Amount Paid {sortBy === 'amountPaid' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('currentBalance')} className="sortable">
                Balance {sortBy === 'currentBalance' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('processingFees')} className="sortable">
                Loan Fee {sortBy === 'processingFees' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')} className="sortable">
                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('startDate')} className="sortable">
                Start Date {sortBy === 'startDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Paid Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedLoans.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  No loans found
                </td>
              </tr>
            ) : (
              sortedLoans.map((loan) => (
                <tr key={loan.id} className="loan-row">
                  <td className="loan-id">
                    {loan.loanId || `L${loan.id}`}
                  </td>
                  <td className="borrower-info">
                    <div className="borrower-details">
                      <span className="borrower-name">
                        {`${loan.borrower?.firstName || ''} ${loan.borrower?.lastName || ''}`.trim() || 'Unknown'}
                      </span>
                      <span className="borrower-email">
                        {loan.borrower?.email}
                      </span>
                    </div>
                  </td>
                  <td className="amount">
                    {formatCurrency(loan.principalAmount)}
                  </td>
                  <td className="amount-paid">
                    {formatCurrency(loan.amountPaid || 0)}
                  </td>
                  <td className="balance">
                    {formatCurrency(loan.currentBalance || 0)}
                  </td>
                  <td className="loan-fee">
                    {formatCurrency(parseFloat(loan.processingFees) || 0)}
                  </td>
                  <td className="status">
                    {getStatusBadge(loan.status)}
                  </td>
                  <td className="date">
                    {formatDate(loan.startDate)}
                  </td>
                  <td className="paid-date">
                    {loan.paidAt ? formatDate(loan.paidAt) : '-'}
                  </td>
                  <td className="actions">
                    <div className="payment-controls">
                      <div className="payment-input-row">
                        <input
                          type="number"
                          placeholder="Amount paid"
                          min="0"
                          max={loan.principalAmount}
                          step="0.01"
                          value={paymentAmounts[loan.id] || ''}
                          onChange={(e) => handlePaymentAmountChange(loan.id, e.target.value)}
                          disabled={updatingLoan === loan.id}
                          className="payment-input"
                        />
                        <button 
                          onClick={() => handleUpdateAmountPaid(loan.id)}
                          disabled={updatingLoan === loan.id || !paymentAmounts[loan.id]}
                          className="update-payment-button"
                          title="Update payment amount"
                        >
                          {updatingLoan === loan.id ? '⏳' : '💰'} Update
                        </button>
                      </div>
                      <div className="quick-actions">
                        <button 
                          onClick={() => handleUpdatePaymentStatus(loan.id, true)}
                          disabled={updatingLoan === loan.id}
                          className="mark-paid-button small"
                          title="Mark as fully paid"
                        >
                          ✅ Full
                        </button>
                        <button 
                          onClick={() => handleUpdatePaymentStatus(loan.id, false)}
                          disabled={updatingLoan === loan.id}
                          className="mark-unpaid-button small"
                          title="Reset to unpaid"
                        >
                          🔄 Reset
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLoanManagement;