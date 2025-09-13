import React, { useState, useEffect } from 'react';
import { applicationService } from '../../services/applicationService';
import './ApplicationsPage.css';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await applicationService.getUserApplications();
        setApplications(response.data.applications || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(err.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return '#3b82f6';
      case 'under_review': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="applications-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="applications-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Applications</h3>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <header className="page-header">
        <h1>📄 My Applications</h1>
        <p>Track the status of your loan applications</p>
      </header>

      <div className="applications-container">
        {applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Applications Yet</h3>
            <p>You haven't submitted any loan applications yet.</p>
            <button 
              className="apply-button"
              onClick={() => window.location.href = '/apply'}
            >
              Apply for a Loan
            </button>
          </div>
        ) : (
          <div className="applications-grid">
            {applications.map((application) => (
              <div key={application.id} className="application-card">
                <div className="application-header">
                  <h3>Application #{application.applicationId}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(application.status) }}
                  >
                    {application.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="application-details">
                  <div className="detail-row">
                    <span className="label">Amount Requested:</span>
                    <span className="value">{formatCurrency(application.requestedAmount)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Purpose:</span>
                    <span className="value capitalize">{application.purpose}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Term:</span>
                    <span className="value">{application.requestedTerm} months</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Submitted:</span>
                    <span className="value">{formatDate(application.submittedAt)}</span>
                  </div>

                  {application.assignedOfficer && (
                    <div className="detail-row">
                      <span className="label">Assigned Officer:</span>
                      <span className="value">
                        {application.assignedOfficer.firstName} {application.assignedOfficer.lastName}
                      </span>
                    </div>
                  )}

                  {application.status === 'approved' && application.approvedAmount && (
                    <>
                      <div className="detail-row approved-details">
                        <span className="label">Approved Amount:</span>
                        <span className="value success">{formatCurrency(application.approvedAmount)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Interest Rate:</span>
                        <span className="value">{application.approvedRate}%</span>
                      </div>
                    </>
                  )}

                  {application.status === 'rejected' && application.rejectionReason && (
                    <div className="detail-row">
                      <span className="label">Reason:</span>
                      <span className="value error">{application.rejectionReason}</span>
                    </div>
                  )}
                </div>

                <div className="application-footer">
                  <small className="last-updated">
                    Last updated: {formatDate(application.updatedAt)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;