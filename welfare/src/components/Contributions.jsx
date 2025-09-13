import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import './Contributions.css';

const Contributions = () => {
  const [contributions, setContributions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('contributionDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('confirmed');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingContribution, setAddingContribution] = useState(false);
  const [newContribution, setNewContribution] = useState({
    userId: '',
    amount: '',
    paymentMethod: 'mobile_money',
    referenceNumber: '',
    notes: ''
  });

  useEffect(() => {
    fetchContributions();
    fetchUsers();
  }, []);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getContributions({ status: filterBy });
      if (response.success) {
        setContributions(response.data.contributions || []);
      } else {
        setError(response.message || 'Failed to fetch contributions');
      }
    } catch (error) {
      console.error('Error fetching contributions:', error);
      setError(error.message || 'Error loading contributions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminService.getAllUsers({ limit: 1000 });
      if (response.success) {
        setAllUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const handleAddContribution = async () => {
    if (!newContribution.userId || !newContribution.amount || newContribution.amount <= 0) {
      setError('Please select a user and enter a valid amount');
      return;
    }

    try {
      setAddingContribution(true);
      const response = await adminService.createContribution(newContribution);
      if (response.success) {
        await fetchContributions();
        setShowAddModal(false);
        setNewContribution({
          userId: '',
          amount: '',
          paymentMethod: 'mobile_money',
          referenceNumber: '',
          notes: ''
        });
        setError('');
      } else {
        setError(response.message || 'Failed to add contribution');
      }
    } catch (error) {
      console.error('Error adding contribution:', error);
      setError(error.message || 'Error adding contribution');
    } finally {
      setAddingContribution(false);
    }
  };

  const handleFilterChange = async (newFilter) => {
    setFilterBy(newFilter);
    try {
      setLoading(true);
      const response = await adminService.getContributions({ status: newFilter });
      if (response.success) {
        setContributions(response.data.contributions || []);
      }
    } catch (error) {
      console.error('Error filtering contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedContributions = [...contributions].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'name') {
      aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim();
    }
    
    if (sortBy === 'contributionDate' || sortBy === 'date') {
      aValue = new Date(a.date);
      bValue = new Date(b.date);
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

  const totalContributionsAmount = contributions.reduce((sum, contrib) => sum + (contrib.amount || 0), 0);
  const uniqueContributors = new Set(contributions.map(c => c.userId)).size;
  const recentContributions = contributions.filter(c => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(c.date) >= oneWeekAgo;
  }).length;

  if (loading) {
    return (
      <div className="contributions-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading contributions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contributions-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchContributions} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contributions-container">
      <div className="page-header">
        <h1>💸 Contributions</h1>
        <p>Track and manage member contributions</p>
      </div>

      <div className="contributions-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Contributions</h3>
            <p className="stat-number">{formatCurrency(totalContributionsAmount)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Contributors</h3>
            <p className="stat-number">{uniqueContributors}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Total Records</h3>
            <p className="stat-number">{contributions.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Recent (7 days)</h3>
            <p className="stat-number">{recentContributions}</p>
          </div>
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filterBy} 
            onChange={(e) => handleFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Contributions</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="action-buttons">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="add-contribution-button"
          >
            ➕ Add Contribution
          </button>
          <button onClick={fetchContributions} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="contributions-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('amount')} className="sortable">
                Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('date')} className="sortable">
                Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Payment Method</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Total Contributions</th>
            </tr>
          </thead>
          <tbody>
            {sortedContributions.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  {filterBy === 'confirmed' && contributions.length === 0 
                    ? 'No monthly contributions recorded yet. Click "Add Contribution" to record member contributions.'
                    : 'No contributions found'
                  }
                </td>
              </tr>
            ) : (
              sortedContributions.map((contribution) => (
                <tr key={contribution.id} className="contribution-row">
                  <td className="contributor-name">
                    <div className="name-info">
                      <span className="full-name">
                        {`${contribution.firstName || ''} ${contribution.lastName || ''}`.trim() || 'Unknown'}
                      </span>
                      {contribution.email && (
                        <span className="contributor-email">
                          {contribution.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="amount">
                    {formatCurrency(contribution.amount || 0)}
                  </td>
                  <td className="date">
                    {formatDate(contribution.date)}
                  </td>
                  <td className="payment-method">
                    <span className={`method-badge method-${contribution.paymentMethod}`}>
                      {contribution.paymentMethod?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="reference">
                    {contribution.referenceNumber || '-'}
                  </td>
                  <td className="status">
                    <span className={`status-badge status-${contribution.status}`}>
                      {contribution.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="total-contributions">
                    {formatCurrency(contribution.totalContributions || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Contribution Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Monthly Contribution</h3>
              <button onClick={() => setShowAddModal(false)} className="close-button">✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label>Member:</label>
                <select
                  value={newContribution.userId}
                  onChange={(e) => setNewContribution({...newContribution, userId: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select a member</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount (KES):</label>
                <input
                  type="number"
                  value={newContribution.amount}
                  onChange={(e) => setNewContribution({...newContribution, amount: e.target.value})}
                  className="form-input"
                  placeholder="Enter contribution amount"
                  min="1"
                  step="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method:</label>
                <select
                  value={newContribution.paymentMethod}
                  onChange={(e) => setNewContribution({...newContribution, paymentMethod: e.target.value})}
                  className="form-input"
                >
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reference Number:</label>
                <input
                  type="text"
                  value={newContribution.referenceNumber}
                  onChange={(e) => setNewContribution({...newContribution, referenceNumber: e.target.value})}
                  className="form-input"
                  placeholder="Transaction reference (optional)"
                />
              </div>

              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={newContribution.notes}
                  onChange={(e) => setNewContribution({...newContribution, notes: e.target.value})}
                  className="form-input"
                  placeholder="Additional notes (optional)"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowAddModal(false)} 
                className="cancel-button"
                disabled={addingContribution}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddContribution} 
                className="submit-button"
                disabled={addingContribution || !newContribution.userId || !newContribution.amount}
              >
                {addingContribution ? 'Recording...' : 'Record Contribution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contributions;