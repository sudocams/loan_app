import { useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ user, onNavigate, onLogout }) => {
  const location = useLocation();
  
  const getMenuItems = () => {
    const common = [
      { id: 'dashboard', icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    ];
    
    if (user?.role === 'admin' || user?.role === 'loan_officer') {
      return [
        ...common,
        { id: 'contributions', icon: '💸', label: 'Contributions', path: '/admin/contributions' },
        { id: 'expenditures', icon: '💰', label: 'Expenditures', path: '/admin/expenditures' },
        { id: 'admin-loans', icon: '🏦', label: 'Loan Management', path: '/admin/loans' },
        { id: 'password-reset', icon: '🔑', label: 'Reset Passwords', path: '/password-reset' },
        ...(user?.role === 'admin' ? [
          { id: 'users', icon: '👥', label: 'Users', path: '/admin/users' },
        ] : []),
      ];
    }
    
    return [
      ...common,
      { id: 'apply', icon: '📝', label: 'Apply for Loan', path: '/apply' },
      { id: 'applications', icon: '📄', label: 'My Applications', path: '/applications' },
      { id: 'loans', icon: '💳', label: 'My Loans', path: '/loans' },
    ];
  };
  
  const menuItems = getMenuItems();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">💰</span>
          <span className="logo-text">LoanApp</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.profilePicture ? (
              <img src={`/uploads/${user.profilePicture}`} alt="Profile" />
            ) : (
              <span>👤</span>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="user-role">
              {user?.role?.replace('_', ' ')?.toUpperCase()}
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="logout-button">
          <span className="logout-icon">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;