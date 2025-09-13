import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import './LoanSystem.css';

const LoanSystem = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(''), 3000);
  };

  const handleNavigation = (page) => {
    // Handle admin routes properly
    if (page === 'contributions') {
      navigate('/admin/contributions');
    } else if (page === 'expenditures') {
      navigate('/admin/expenditures');
    } else if (page === 'admin-loans') {
      navigate('/admin/loans');
    } else if (page === 'users') {
      navigate('/admin/users');
    } else {
      navigate(`/${page}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="loan-system">
      {notification && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' : '⚠️'}
            </span>
            {notification.message}
          </div>
        </div>
      )}

      <div className="app-layout">
        <Sidebar 
          user={user} 
          onNavigate={handleNavigation} 
          onLogout={handleLogout}
        />
        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default LoanSystem;