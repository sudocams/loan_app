import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loanService } from '../services/loanService';
import { applicationService } from '../services/applicationService';
import { adminService } from '../services/adminService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    loans: [],
    applications: [],
    stats: {},
    loading: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const promises = [];
        
        if (user?.role === 'admin' || user?.role === 'loan_officer') {
          promises.push(adminService.getDashboardStats());
        }
        
        promises.push(loanService.getUserLoans({ limit: 5 }));
        promises.push(applicationService.getUserApplications({ limit: 5 }));
        
        const results = await Promise.all(promises);
        
        let stats = {};
        let resultsIndex = 0;
        
        if (user?.role === 'admin' || user?.role === 'loan_officer') {
          stats = results[resultsIndex].data.stats;
          resultsIndex++;
        }
        
        const loans = results[resultsIndex].data.loans;
        const applications = results[resultsIndex + 1].data.applications;
        
        setDashboardData({
          loans,
          applications,
          stats,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (dashboardData.loading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>💰 Loan Management Dashboard</h1>
        <p className="dashboard-subtitle">
          {getGreeting()}, {user?.firstName || 'User'}! Welcome to your financial overview
        </p>
      </header>
      
      <div className="dashboard-stats">
        {user?.role === 'admin' || user?.role === 'loan_officer' ? (
          <>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <h3>Total Applications</h3>
                <p className="stat-number">{dashboardData.stats.totalApplications || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>Pending Applications</h3>
                <p className="stat-number pending">{dashboardData.stats.pendingApplications || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Active Loans</h3>
                <p className="stat-number approved">{dashboardData.stats.activeLoans || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>Total Loan Amount</h3>
                <p className="stat-number">{formatCurrency(dashboardData.stats.totalLoanAmount)}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon">📄</div>
              <div className="stat-content">
                <h3>My Applications</h3>
                <p className="stat-number">{dashboardData.applications?.length || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏦</div>
              <div className="stat-content">
                <h3>Active Loans</h3>
                <p className="stat-number">{dashboardData.loans?.length || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💳</div>
              <div className="stat-content">
                <h3>Total Borrowed</h3>
                <p className="stat-number">
                  {formatCurrency(
                    dashboardData.loans?.reduce((sum, loan) => sum + loan.terms?.principalAmount || 0, 0)
                  )}
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>Current Balance</h3>
                <p className="stat-number">
                  {formatCurrency(
                    dashboardData.loans?.reduce((sum, loan) => sum + loan.currentBalance || 0, 0)
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="quick-actions">
        {user?.role === 'admin' || user?.role === 'loan_officer' ? (
          <>
            <div className="action-card" onClick={() => navigate('/admin/applications')}>
              <div className="action-icon">📋</div>
              <div className="action-content">
                <h3>Review Applications</h3>
                <p>Manage loan applications</p>
                <div className="action-arrow">→</div>
              </div>
            </div>
            
            <div className="action-card" onClick={() => navigate('/admin/loans')}>
              <div className="action-icon">🏦</div>
              <div className="action-content">
                <h3>Manage Loans</h3>
                <p>View and manage active loans</p>
                <div className="action-arrow">→</div>
              </div>
            </div>

            <div className="action-card" onClick={() => navigate('/password-reset')}>
              <div className="action-icon">🔑</div>
              <div className="action-content">
                <h3>Reset Passwords</h3>
                <p>Reset user passwords</p>
                <div className="action-arrow">→</div>
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className="action-card" onClick={() => navigate('/admin/products')}>
                <div className="action-icon">📊</div>
                <div className="action-content">
                  <h3>Loan Products</h3>
                  <p>Create and manage loan products</p>
                  <div className="action-arrow">→</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="action-card" onClick={() => navigate('/apply')}>
              <div className="action-icon">📝</div>
              <div className="action-content">
                <h3>Apply for Loan</h3>
                <p>Start a new loan application</p>
                <div className="action-arrow">→</div>
              </div>
            </div>
            
            <div className="action-card" onClick={() => navigate('/applications')}>
              <div className="action-icon">📄</div>
              <div className="action-content">
                <h3>My Applications</h3>
                <p>Track your loan applications</p>
                <div className="action-arrow">→</div>
              </div>
            </div>

            <div className="action-card" onClick={() => navigate('/loans')}>
              <div className="action-icon">💳</div>
              <div className="action-content">
                <h3>My Loans</h3>
                <p>View and manage your loans</p>
                <div className="action-arrow">→</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="recent-activity">
        <div className="section-header">
          <h2>📋 Recent Activity</h2>
          <span className="activity-count">
            {(dashboardData.applications?.length || 0) + (dashboardData.loans?.length || 0)} items
          </span>
        </div>
        <div className="activity-preview">
          {dashboardData.applications?.length === 0 && dashboardData.loans?.length === 0 ? (
            <div className="no-activity">
              <span className="empty-icon">📝</span>
              <p>No recent activity</p>
              <small>Start by applying for a loan or managing existing ones</small>
            </div>
          ) : (
            <>
              {dashboardData.applications?.slice(0, 3).map(application => (
                <div key={application._id} className={`activity-item application ${application.status}`}>
                  <div className="activity-info">
                    <div className="activity-type">
                      <span className="activity-icon">📄</span>
                      Application #{application.applicationId}
                    </div>
                    <div className="activity-details">
                      <span className={`status ${application.status}`}>
                        {application.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <small>{formatCurrency(application.requestedAmount)}</small>
                    </div>
                  </div>
                  <div className="activity-meta">
                    <small>{new Date(application.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
              
              {dashboardData.loans?.slice(0, 2).map(loan => (
                <div key={loan._id} className={`activity-item loan ${loan.status}`}>
                  <div className="activity-info">
                    <div className="activity-type">
                      <span className="activity-icon">🏦</span>
                      Loan #{loan.loanId}
                    </div>
                    <div className="activity-details">
                      <span className={`status ${loan.status}`}>
                        {loan.status.toUpperCase()}
                      </span>
                      <small>Balance: {formatCurrency(loan.currentBalance)}</small>
                    </div>
                  </div>
                  <div className="activity-meta">
                    <small>Next payment: {loan.nextPaymentDue ? new Date(loan.nextPaymentDue.dueDate).toLocaleDateString() : 'N/A'}</small>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;