import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllUsers({ limit: 100 });
      if (response.success) {
        setUsers(response.data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error loading users');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      'admin': { color: 'purple', label: 'Admin' },
      'loan_officer': { color: 'blue', label: 'Loan Officer' },
      'customer': { color: 'green', label: 'Customer' }
    };
    
    const roleInfo = roleMap[role] || { color: 'gray', label: role };
    
    return (
      <span className={`role-badge role-${roleInfo.color}`}>
        {roleInfo.label}
      </span>
    );
  };

  const getStatusBadge = (isEmailVerified) => {
    return (
      <span className={`status-badge ${isEmailVerified ? 'status-verified' : 'status-unverified'}`}>
        {isEmailVerified ? '✅ Verified' : '⏳ Unverified'}
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    if (filterRole === 'all') return true;
    return user.role === filterRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'name') {
      aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim();
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
      <div className="users-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchUsers} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="page-header">
        <h1>👥 User Management</h1>
        <p>Manage all system users and their roles</p>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{users.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <h3>Admins</h3>
            <p className="stat-number">{users.filter(u => u.role === 'admin').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏦</div>
          <div className="stat-content">
            <h3>Loan Officers</h3>
            <p className="stat-number">{users.filter(u => u.role === 'loan_officer').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <h3>Customers</h3>
            <p className="stat-number">{users.filter(u => u.role === 'customer').length}</p>
          </div>
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>Filter by Role:</label>
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="loan_officer">Loan Officers</option>
            <option value="customer">Customers</option>
          </select>
        </div>
        <button onClick={fetchUsers} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('email')} className="sortable">
                Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Phone</th>
              <th onClick={() => handleSort('role')} className="sortable">
                Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Status</th>
              <th onClick={() => handleSort('createdAt')} className="sortable">
                Joined {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No users found
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr key={user.id} className="user-row">
                  <td className="user-name">
                    <div className="name-info">
                      <span className="full-name">
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="user-email">
                    {user.email}
                  </td>
                  <td className="user-phone">
                    {user.phoneNumber || '-'}
                  </td>
                  <td className="user-role">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="user-status">
                    {getStatusBadge(user.isEmailVerified)}
                  </td>
                  <td className="join-date">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="last-login">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
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

export default UsersPage;