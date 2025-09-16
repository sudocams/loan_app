import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import './Expenditures.css';

const Expenditures = () => {
  const [expenditures, setExpenditures] = useState([]);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sortBy, setSortBy] = useState('expenditureDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [updatingExpenditure, setUpdatingExpenditure] = useState(null);

  const [newExpenditure, setNewExpenditure] = useState({
    beneficiaryId: '',
    type: 'death',
    amount: '',
    description: '',
    paymentMethod: 'bank_transfer',
    referenceNumber: ''
  });

  useEffect(() => {
    fetchExpenditures();
    fetchUsers();
    fetchSummary();
  }, []);

  const fetchExpenditures = async () => {
    try {
      setLoading(true);
      const response = await adminService.getExpenditures({ limit: 100 });
      
      if (response?.success) {
        setExpenditures(response.data?.expenditures || []);
      } else {
        setError(response?.message || 'Failed to fetch expenditures');
      }
    } catch (error) {
      console.error('Error fetching expenditures:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminService.getAllUsers({ limit: 1000 });
      if (response?.success) {
        setUsers(response.data?.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      console.log('Fetching expenditure summary...');
      const response = await adminService.getExpenditureSummary();
      console.log('Expenditure summary response:', response);
      if (response?.success) {
        const summaryData = response.data?.summary || {};
        console.log('Summary data:', summaryData);
        setSummary(summaryData);
      } else {
        console.error('Summary API error:', response?.message);
      }
    } catch (error) {
      console.error('Error fetching expenditure summary:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const handleCreateExpenditure = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await adminService.createExpenditure(newExpenditure);
      
      if (response?.success) {
        await fetchExpenditures();
        await fetchSummary();
        setShowCreateForm(false);
        setNewExpenditure({
          beneficiaryId: '',
          type: 'death',
          amount: '',
          description: '',
          paymentMethod: 'bank_transfer',
          referenceNumber: ''
        });
      } else {
        setError(response?.message || 'Failed to create expenditure');
      }
    } catch (error) {
      console.error('Error creating expenditure:', error);
      setError('Failed to create expenditure');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpenditure = async (expenditureId, updates) => {
    try {
      setUpdatingExpenditure(expenditureId);
      const response = await adminService.updateExpenditure(expenditureId, updates);
      
      if (response?.success) {
        await fetchExpenditures();
        await fetchSummary();
      } else {
        setError(response?.message || 'Failed to update expenditure');
      }
    } catch (error) {
      console.error('Error updating expenditure:', error);
      setError('Failed to update expenditure');
    } finally {
      setUpdatingExpenditure(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0);
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
      'pending': { color: 'orange', label: 'Pending' },
      'approved': { color: 'blue', label: 'Approved' },
      'paid': { color: 'green', label: 'Paid' },
      'cancelled': { color: 'red', label: 'Cancelled' }
    };
    
    const statusInfo = statusMap[status] || { color: 'gray', label: status };
    
    return (
      <span className={`status-badge status-${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const typeMap = {
      'death': '⚰️',
      'childbirth': '👶',
      'wedding': '💒'
    };
    return typeMap[type] || '📋';
  };

  const filteredExpenditures = expenditures.filter(expenditure => {
    if (filterStatus !== 'all' && expenditure.status !== filterStatus) return false;
    if (filterType !== 'all' && expenditure.type !== filterType) return false;
    return true;
  });

  const sortedExpenditures = [...filteredExpenditures].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'beneficiary') {
      aValue = `${a.beneficiary?.firstName || ''} ${a.beneficiary?.lastName || ''}`.trim();
      bValue = `${b.beneficiary?.firstName || ''} ${b.beneficiary?.lastName || ''}`.trim();
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

  if (loading && expenditures.length === 0) {
    return (
      <div className="expenditures-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading expenditures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expenditures-container">
      <div className="page-header">
        <h1>💰 Expenditure Management</h1>
        <p>Manage death, childbirth, and wedding expenditures</p>
      </div>

      {/* Summary Stats */}
      <div className="expenditure-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Expenditures</h3>
            <p className="stat-number">{summary.totalExpenditures || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p className="stat-number pending">{summary.pendingExpenditures || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Paid</h3>
            <p className="stat-number approved">{summary.paidExpenditures || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <h3>Total Paid</h3>
            <p className="stat-number">{formatCurrency(summary.totalAmountPaid || 0)}</p>
            
          </div>
        </div>
      </div>

      {/* Expenditure Types Breakdown */}
      <div className="type-breakdown">
        <h3>💼 Expenditure Types</h3>
        <div className="type-cards">
          <div className="type-card">
            <div className="type-icon">⚰️</div>
            <div className="type-content">
              <h4>Death</h4>
              <p>{formatCurrency(summary.expendituresByType?.death?.totalAmount || 0)}</p>
              <small>{summary.expendituresByType?.death?.count || 0} cases</small>
            </div>
          </div>
          <div className="type-card">
            <div className="type-icon">👶</div>
            <div className="type-content">
              <h4>Childbirth</h4>
              <p>{formatCurrency(summary.expendituresByType?.childbirth?.totalAmount || 0)}</p>
              <small>{summary.expendituresByType?.childbirth?.count || 0} cases</small>
            </div>
          </div>
          <div className="type-card">
            <div className="type-icon">💒</div>
            <div className="type-content">
              <h4>Wedding</h4>
              <p>{formatCurrency(summary.expendituresByType?.wedding?.totalAmount || 0)}</p>
              <small>{summary.expendituresByType?.wedding?.count || 0} cases</small>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="expenditure-controls">
        <div className="filters-container">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Filter by Type:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="death">Death</option>
              <option value="childbirth">Childbirth</option>
              <option value="wedding">Wedding</option>
            </select>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="create-expenditure-btn"
          >
            ➕ New Expenditure
          </button>
          <button onClick={fetchExpenditures} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {/* Create Expenditure Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Expenditure</h2>
              <button 
                onClick={() => setShowCreateForm(false)} 
                className="close-modal"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateExpenditure} className="expenditure-form">
              <div className="form-group">
                <label>Beneficiary:</label>
                <select
                  value={newExpenditure.beneficiaryId}
                  onChange={(e) => setNewExpenditure(prev => ({...prev, beneficiaryId: e.target.value}))}
                  required
                  className="form-input"
                >
                  <option value="">Select Beneficiary</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Type:</label>
                <select
                  value={newExpenditure.type}
                  onChange={(e) => setNewExpenditure(prev => ({...prev, type: e.target.value}))}
                  required
                  className="form-input"
                >
                  <option value="death">Death</option>
                  <option value="childbirth">Childbirth</option>
                  <option value="wedding">Wedding</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount (KSh):</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newExpenditure.amount}
                  onChange={(e) => setNewExpenditure(prev => ({...prev, amount: e.target.value}))}
                  required
                  className="form-input"
                  placeholder="Enter amount"
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newExpenditure.description}
                  onChange={(e) => setNewExpenditure(prev => ({...prev, description: e.target.value}))}
                  className="form-input"
                  placeholder="Enter description or notes"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Payment Method:</label>
                <select
                  value={newExpenditure.paymentMethod}
                  onChange={(e) => setNewExpenditure(prev => ({...prev, paymentMethod: e.target.value}))}
                  className="form-input"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reference Number:</label>
                <input
                  type="text"
                  value={newExpenditure.referenceNumber}
                  onChange={(e) => setNewExpenditure(prev => ({...prev, referenceNumber: e.target.value}))}
                  className="form-input"
                  placeholder="Enter reference number (optional)"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? 'Creating...' : 'Create Expenditure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenditures Table */}
      <div className="table-container">
        <table className="expenditures-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Beneficiary</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenditures.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  No expenditures found
                </td>
              </tr>
            ) : (
              sortedExpenditures.map((expenditure) => (
                <tr key={expenditure.id} className="expenditure-row">
                  <td className="expenditure-id">
                    {expenditure.expenditureId}
                  </td>
                  <td className="type">
                    <div className="type-display">
                      <span className="type-icon">{getTypeIcon(expenditure.type)}</span>
                      {expenditure.type.charAt(0).toUpperCase() + expenditure.type.slice(1)}
                    </div>
                  </td>
                  <td className="beneficiary-info">
                    <div className="beneficiary-details">
                      <span className="beneficiary-name">
                        {`${expenditure.beneficiary?.firstName || ''} ${expenditure.beneficiary?.lastName || ''}`.trim() || 'Unknown'}
                      </span>
                      <span className="beneficiary-email">
                        {expenditure.beneficiary?.email}
                      </span>
                    </div>
                  </td>
                  <td className="amount">
                    {formatCurrency(expenditure.amount)}
                  </td>
                  <td className="date">
                    {formatDate(expenditure.expenditureDate)}
                  </td>
                  <td className="status">
                    {getStatusBadge(expenditure.status)}
                  </td>
                  <td className="payment-method">
                    {expenditure.paymentMethod?.replace('_', ' ') || 'N/A'}
                  </td>
                  <td className="actions">
                    <div className="action-buttons">
                      {expenditure.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateExpenditure(expenditure.id, { status: 'approved' })}
                            disabled={updatingExpenditure === expenditure.id}
                            className="approve-btn"
                          >
                            ✅ Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateExpenditure(expenditure.id, { status: 'cancelled' })}
                            disabled={updatingExpenditure === expenditure.id}
                            className="cancel-btn"
                          >
                            ❌ Cancel
                          </button>
                        </>
                      )}
                      {expenditure.status === 'approved' && (
                        <button 
                          onClick={() => handleUpdateExpenditure(expenditure.id, { status: 'paid' })}
                          disabled={updatingExpenditure === expenditure.id}
                          className="pay-btn"
                        >
                          💰 Mark Paid
                        </button>
                      )}
                      {expenditure.status === 'paid' && (
                        <span className="paid-text">✅ Paid</span>
                      )}
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

export default Expenditures;