import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './PasswordReset.css';

const PasswordReset = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data.users);
    } catch (error) {
      setError('Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setResetLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(data.message || 'Failed to reset password');
      }

      setMessage(`Password successfully reset for ${selectedUser.username || `${selectedUser.firstName} ${selectedUser.lastName}`}`);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Failed to reset password: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleUserSelect = (userData) => {
    setSelectedUser(userData);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setMessage('');
  };

  if (loading) {
    return (
      <div className="password-reset loading">
        <div className="loading-spinner">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="password-reset">
      <div className="password-reset-header">
        <h1>🔑 Password Reset</h1>
        <p>Reset passwords for users in the system</p>
      </div>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="password-reset-content">
        <div className="users-section">
          <h2>Select User</h2>
          <div className="users-list">
            {users.length === 0 ? (
              <div className="no-users">
                <p>No users found</p>
              </div>
            ) : (
              users.map((userData) => (
                <div
                  key={userData.id}
                  className={`user-card ${selectedUser?.id === userData.id ? 'selected' : ''}`}
                  onClick={() => handleUserSelect(userData)}
                >
                  <div className="user-info">
                    <div className="user-name">
                      <strong>{userData.username || `${userData.firstName} ${userData.lastName}`}</strong>
                    </div>
                    <div className="user-email">{userData.email}</div>
                    <div className="user-role">
                      <span className={`role-badge ${userData.role}`}>
                        {userData.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="user-meta">
                    <small>Joined: {new Date(userData.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="reset-form-section">
          <h2>Reset Password</h2>
          {selectedUser ? (
            <form onSubmit={handleResetPassword} className="reset-form">
              <div className="selected-user-info">
                <h3>Resetting password for:</h3>
                <div className="user-details">
                  <p><strong>Name:</strong> {selectedUser.username || `${selectedUser.firstName} ${selectedUser.lastName}`}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {selectedUser.role.replace('_', ' ').toUpperCase()}</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="password-requirements">
                <p>Password requirements:</p>
                <ul>
                  <li>At least 6 characters long</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                </ul>
              </div>

              <button
                type="submit"
                className="reset-button"
                disabled={resetLoading}
              >
                {resetLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="no-user-selected">
              <p>Please select a user from the list to reset their password</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;