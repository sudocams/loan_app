import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import './AdminLoansTable.css';

const AdminLoansTable = () => {
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
      const response = await adminService.getAllApplications();
      if (response.data.success) {
        setLoans(response.data.data.applications);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'draft': { color: 'gray', label: 'Draft' },
      'submitted': { color: 'blue', label: 'Submitted' },
      'under_review': { color: 'yellow', label: 'Under Review' },
      'approved': { color: 'green', label: 'Approved' },
      'rejected': { color: 'red', label: 'Rejected' }
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
    
    if (sortBy === 'applicant') {
      aValue = a.applicant?.name || '';
      bValue = b.applicant?.name || '';
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
      <div className="admin-loans-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading loans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-loans-container">
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
    <div className="admin-loans-container">
      <div className="page-header">
        <h1>🏦 Loan Applications</h1>
        <p>Manage and view all loan applications</p>
      </div>

      <div className="loans-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Applications</h3>
            <p className="stat-number">{loans.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Approved</h3>
            <p className="stat-number">{loans.filter(l => l.status === 'approved').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p className="stat-number">{loans.filter(l => ['submitted', 'under_review'].includes(l.status)).length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>Rejected</h3>
            <p className="stat-number">{loans.filter(l => l.status === 'rejected').length}</p>
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
            <option value="all">All Applications</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
              <th onClick={() => handleSort('applicationId')} className="sortable">
                Application ID {sortBy === 'applicationId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('applicant')} className="sortable">
                Borrower {sortBy === 'applicant' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('requestedAmount')} className="sortable">
                Amount {sortBy === 'requestedAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Fee</th>
              <th>Total</th>
              <th>Purpose</th>
              <th onClick={() => handleSort('status')} className="sortable">
                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('createdAt')} className="sortable">
                Applied {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedLoans.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  No loan applications found
                </td>
              </tr>
            ) : (
              sortedLoans.map((loan) => (
                <tr key={loan.id} className="loan-row">
                  <td className="application-id">
                    {loan.applicationId}
                  </td>
                  <td className="borrower-info">
                    <div className="borrower-details">
                      <span className="borrower-name">
                        {loan.applicant?.name || 'Unknown'}
                      </span>
                      <span className="borrower-email">
                        {loan.applicant?.email}
                      </span>
                      {loan.applicant?.phone && (
                        <span className="borrower-phone">
                          {loan.applicant.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="amount">
                    {formatCurrency(loan.requestedAmount)}
                  </td>
                  <td className="fee">
                    {formatCurrency(loan.fee)}
                  </td>
                  <td className="total">
                    {formatCurrency(loan.totalAmount)}
                  </td>
                  <td className="purpose">
                    <div className="purpose-info">
                      <span className="purpose-main">{loan.purpose || 'Not specified'}</span>
                      {loan.purposeDescription && (
                        <span className="purpose-description">
                          {loan.purposeDescription}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="status">
                    {getStatusBadge(loan.status)}
                  </td>
                  <td className="date">
                    {formatDate(loan.createdAt)}
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

export default AdminLoansTable;