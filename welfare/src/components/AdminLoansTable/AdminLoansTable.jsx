import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import './AdminLoansTable.css';

const AdminLoansTable = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [assigningLoan, setAssigningLoan] = useState(null);
  const [loanOfficers, setLoanOfficers] = useState([]);

  useEffect(() => {
    fetchLoans();
    fetchLoanOfficers();
  }, []);

  const fetchLoanOfficers = async () => {
    try {
      const response = await adminService.getLoanOfficers();
      if (response.success) {
        setLoanOfficers(response.data.officers || []);
      }
    } catch (error) {
      console.error('Error fetching loan officers:', error);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllApplications();
      if (response.success) {
        setLoans(response.data.applications);
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

  const calculateLoanFee = (amount) => {
    const numAmount = parseFloat(amount);
    if (numAmount >= 1000 && numAmount <= 5000) return 100;
    if (numAmount > 5000 && numAmount <= 10000) return 200;
    if (numAmount > 10000 && numAmount <= 15000) return 300;
    if (numAmount > 15000 && numAmount <= 20000) return 500;
    return 0;
  };

  const handleAssignOfficer = async (loanId, officerId) => {
    try {
      setAssigningLoan(loanId);
      await adminService.assignOfficer(loanId, officerId);
      await fetchLoans(); // Refresh the table
      setAssigningLoan(null);
    } catch (error) {
      console.error('Error assigning officer:', error);
      setError('Failed to assign officer');
      setAssigningLoan(null);
    }
  };

  const handleApprove = async (loanId) => {
    try {
      setAssigningLoan(loanId);
      const response = await adminService.reviewApplication(loanId, { 
        status: 'approved',
        reviewComments: 'Application approved'
      });
      
      if (response.success) {
        await fetchLoans();
        setAssigningLoan(null);
        setError(''); // Clear any previous errors
      } else {
        setError(response.message || 'Failed to approve application');
        setAssigningLoan(null);
      }
    } catch (error) {
      console.error('Error approving application:', error);
      setError(error.message || 'Failed to approve application');
      setAssigningLoan(null);
    }
  };

  const handleReject = async (loanId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      setAssigningLoan(loanId);
      await adminService.reviewApplication(loanId, { 
        status: 'rejected',
        reviewComments: reason
      });
      await fetchLoans();
      setAssigningLoan(null);
    } catch (error) {
      console.error('Error rejecting application:', error);
      setError('Failed to reject application');
      setAssigningLoan(null);
    }
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
      aValue = `${a.applicant?.firstName || ''} ${a.applicant?.lastName || ''}`.trim();
      bValue = `${b.applicant?.firstName || ''} ${b.applicant?.lastName || ''}`.trim();
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedLoans.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
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
                        {`${loan.applicant?.firstName || ''} ${loan.applicant?.lastName || ''}`.trim() || 'Unknown'}
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
                    {formatCurrency(calculateLoanFee(loan.requestedAmount))}
                  </td>
                  <td className="total">
                    {formatCurrency(parseFloat(loan.requestedAmount) + calculateLoanFee(loan.requestedAmount))}
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
                  <td className="actions">
                    {loan.status === 'submitted' && !loan.assignedOfficerId ? (
                      <div className="action-buttons">
                        <select 
                          onChange={(e) => handleAssignOfficer(loan.id, e.target.value)}
                          disabled={assigningLoan === loan.id}
                          className="assign-select"
                          defaultValue=""
                        >
                          <option value="" disabled>Assign Officer</option>
                          {loanOfficers.map(officer => (
                            <option key={officer.id} value={officer.id}>
                              {officer.firstName} {officer.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : loan.status === 'under_review' || (loan.status === 'submitted' && loan.assignedOfficerId) ? (
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleApprove(loan.id)}
                          disabled={assigningLoan === loan.id}
                          className="approve-button"
                          title="Approve application"
                        >
                          ✅ Approve
                        </button>
                        <button 
                          onClick={() => handleReject(loan.id)}
                          disabled={assigningLoan === loan.id}
                          className="reject-button"
                          title="Reject application"
                        >
                          ❌ Reject
                        </button>
                        {loan.assignedOfficerId && (
                          <div className="assigned-info">
                            Assigned: {loan.assignedOfficer?.firstName} {loan.assignedOfficer?.lastName}
                          </div>
                        )}
                      </div>
                    ) : loan.status === 'approved' || loan.status === 'rejected' ? (
                      <div className="final-status">
                        <span className={`final-status-text ${loan.status}`}>
                          {loan.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                        </span>
                        {loan.assignedOfficerId && (
                          <div className="assigned-info">
                            Reviewed by: {loan.assignedOfficer?.firstName} {loan.assignedOfficer?.lastName}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="no-action">-</span>
                    )}
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