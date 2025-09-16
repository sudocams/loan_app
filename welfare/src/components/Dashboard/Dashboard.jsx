import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loanService } from '../../services/loanService';
import { applicationService } from '../../services/applicationService';
import { adminService } from '../../services/adminService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    loans: [],
    applications: [],
    stats: {},
    financialMetrics: {},
    loading: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const promises = [];
        
        if (user?.role === 'admin' || user?.role === 'loan_officer') {
          promises.push(adminService.getDashboardStats());
          promises.push(adminService.getFinancialMetrics());
        }
        
        if (user?.role === 'customer') {
          // console.log('Fetching customer loans and applications...');
          promises.push(loanService.getUserLoans({ limit: 5 }));
          promises.push(applicationService.getUserApplications({ limit: 5 }));
        }
        
        const results = await Promise.all(promises);
        // console.log('Dashboard API results:', results);
        
        let stats = {};
        let financialMetrics = {};
        let loans = [];
        let applications = [];
        let resultsIndex = 0;
        
        if (user?.role === 'admin' || user?.role === 'loan_officer') {
          stats = results[resultsIndex].data.stats;
          financialMetrics = results[resultsIndex + 1].data.metrics;
          resultsIndex += 2;
        }
        
        if (user?.role === 'customer') {
          loans = results[resultsIndex].data.loans || [];
          applications = results[resultsIndex + 1].data.applications || [];
          // console.log('Customer dashboard - loans:', loans);
          // console.log('Customer dashboard - applications:', applications);
          // console.log('Loans data structure:', loans.length > 0 ? loans[0] : 'No loans');
        }
        
        setDashboardData({
          loans,
          applications,
          stats,
          financialMetrics,
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
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
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
        ) : null}
      </div>

      {/* Financial Metrics Section for Admin and Loan Officers */}
      {(user?.role === 'admin' || user?.role === 'loan_officer') && (
        <div className="financial-metrics">
          <div className="section-header">
            <h2>💼 Financial Overview</h2>
            <span className="metrics-timestamp">
              {dashboardData.financialMetrics.timestamp ? 
                `Updated: ${new Date(dashboardData.financialMetrics.timestamp).toLocaleString()}` : 
                'Loading...'}
            </span>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-card primary">
              <div className="metric-icon">💳</div>
              <div className="metric-content">
                <h3>Total Contributions</h3>
                <p className="metric-number">{formatCurrency(dashboardData.financialMetrics.totalContributions)}</p>
                <small>{dashboardData.financialMetrics.totalContributionsCount || 0} contributions</small>
              </div>
            </div>
            
            <div className="metric-card success">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <h3>Total Collected Loan Fees</h3>
                <p className="metric-number">{formatCurrency(dashboardData.financialMetrics.totalCollectedLoanFees)}</p>
                <small>Processing fees collected</small>
              </div>
            </div>
            
            <div className="metric-card warning">
              <div className="metric-icon">📊</div>
              <div className="metric-content">
                <h3>Expenditures</h3>
                <p className="metric-number">{formatCurrency(dashboardData.financialMetrics.expenditures)}</p>
                <small>Operational costs</small>
              </div>
            </div>
            
            <div className="metric-card danger">
              <div className="metric-icon">⚠️</div>
              <div className="metric-content">
                <h3>Outstanding Loans</h3>
                <p className="metric-number">{formatCurrency(dashboardData.financialMetrics.outstandingLoans)}</p>
                <small>{dashboardData.financialMetrics.activeLoansCount || 0} active loans</small>
              </div>
            </div>
            
            <div className="metric-card info">
              <div className="metric-icon">💸</div>
              <div className="metric-content">
                <h3>Transaction Charges</h3>
                <p className="metric-number">{formatCurrency(dashboardData.financialMetrics.transactionCharges)}</p>
                <small>Banking and transfer fees</small>
              </div>
            </div>
            
            <div className="metric-card primary">
              <div className="metric-icon">💎</div>
              <div className="metric-content">
                <h3>Available Balance After Expenditure</h3>
                <p className="metric-number">{formatCurrency(dashboardData.financialMetrics.availableBalanceAfterExpenditure)}</p>
                <small>Net available funds</small>
              </div>
            </div>
            
            <div className="metric-card success">
              <div className="metric-icon">🏦</div>
              <div className="metric-content">
                <h3>Available Balance for Loans</h3>
                <p className="metric-number">{formatCurrency(dashboardData.financialMetrics.availableBalanceForLoans)}</p>
                <small>Funds available for lending</small>
              </div>
            </div>
            
            <div className="metric-card highlight">
              <div className="metric-icon">🏧</div>
              <div className="metric-content">
                <h3>Current Bank Balance</h3>
                <p className="metric-number">{formatCurrency(dashboardData.financialMetrics.currentBankBalance)}</p>
                <small>Total organization balance</small>
              </div>
            </div>
          </div>
          
          <div className="metrics-summary">
            <div className="summary-card">
              <div className="summary-icon">📈</div>
              <div className="summary-content">
                <h4>Collection Rate</h4>
                <p className="summary-value">{dashboardData.financialMetrics.collectionRate?.toFixed(1) || 0}%</p>
                <small>Amount paid vs loaned</small>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">⚖️</div>
              <div className="summary-content">
                <h4>Outstanding Loan Ratio</h4>
                <p className="summary-value">{dashboardData.financialMetrics.outstandingLoanRatio?.toFixed(1) || 0}%</p>
                <small>Outstanding vs contributions</small>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-stats">
        {user?.role === 'customer' ? (
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
                <h3>Loan plus loan fee</h3>
                <p className="stat-number">
                  {formatCurrency(
                    dashboardData.loans?.reduce((sum, loan) => {
                      const principal = parseFloat(loan.principalAmount) || 0;
                      const processingFee = parseFloat(loan.processingFees) || 0;
                      return sum + principal + processingFee;
                    }, 0)
                  )}
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>Actual Amount Borrowed</h3>
                <p className="stat-number">
                  {formatCurrency(
                    dashboardData.loans?.reduce((sum, loan) => {
                      const principal = parseFloat(loan.principalAmount) || 0;
                      return sum + principal;
                    }, 0)
                  )}
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Amount Paid</h3>
                <p className="stat-number">
                  {formatCurrency(
                    dashboardData.loans?.reduce((sum, loan) => sum + (parseFloat(loan.amountPaid) || 0), 0)
                  )}
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚖️</div>
              <div className="stat-content">
                <h3>Current Balance</h3>
                <p className="stat-number">
                  {formatCurrency(
                    dashboardData.loans?.reduce((sum, loan) => sum + (parseFloat(loan.currentBalance) || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </>
        ) : null}
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
              <div className="action-card" onClick={() => navigate('/admin/users')}>
                <div className="action-icon">👥</div>
                <div className="action-content">
                  <h3>User Management</h3>
                  <p>Manage system users</p>
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

      {user?.role === 'customer' && (
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
      )}
    </div>
  );
};

export default Dashboard;