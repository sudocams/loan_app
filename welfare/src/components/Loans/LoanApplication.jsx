import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services/applicationService';
import './LoanApplication.css';

const LoanApplication = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [canApply, setCanApply] = useState(true);
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  const [formData, setFormData] = useState({
    requestedAmount: '',
    purpose: '',
    purposeDescription: ''
  });
  const [loanDetails, setLoanDetails] = useState({
    amount: 0,
    fee: 0,
    total: 0
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    checkEligibility();
  }, []);

  // Calculate fee based on loan amount
  const calculateFee = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount >= 1000 && numAmount <= 5000) return 100;
    if (numAmount > 5000 && numAmount <= 10000) return 200;
    if (numAmount > 10000 && numAmount <= 15000) return 300;
    if (numAmount > 15000 && numAmount <= 20000) return 500;
    return 0;
  };

  // Check if user is eligible to apply for a loan
  const checkEligibility = async () => {
    try {
      const response = await applicationService.checkLoanEligibility();
      if (response.success) {
        setCanApply(response.data.eligible);
        setEligibilityMessage(response.data.message || '');
      } else {
        console.error('Eligibility check failed:', response);
        setEligibilityMessage('Unable to check loan eligibility. Please try refreshing the page.');
        setCanApply(false);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      // If it's an authentication error, allow the form to show but warn the user
      if (error.message && error.message.includes('401')) {
        setEligibilityMessage('Please log in again to apply for a loan.');
        setCanApply(false);
      } else {
        // For other errors, assume they can apply but warn them
        setEligibilityMessage('Unable to verify eligibility. You may proceed with the application.');
        setCanApply(true);
      }
    }
  };

  // Update loan details when amount changes
  useEffect(() => {
    const amount = parseFloat(formData.requestedAmount) || 0;
    const fee = calculateFee(amount);
    const total = amount + fee;

    setLoanDetails({
      amount,
      fee,
      total
    });
  }, [formData.requestedAmount]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear any existing error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const amount = parseFloat(formData.requestedAmount);

    if (!formData.requestedAmount) {
      newErrors.requestedAmount = 'Loan amount is required';
    } else if (amount < 1000) {
      newErrors.requestedAmount = 'Minimum loan amount is KSh 1,000';
    } else if (amount > 20000) {
      newErrors.requestedAmount = 'Maximum loan amount is KSh 20,000';
    }

    if (!formData.purpose) {
      newErrors.purpose = 'Loan purpose is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canApply) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const submissionData = {
        requestedAmount: parseFloat(formData.requestedAmount),
        purpose: formData.purpose,
        purposeDescription: formData.purposeDescription || '',
        fee: loanDetails.fee,
        totalAmount: loanDetails.total
      };

      const response = await applicationService.submitLoanApplication(submissionData);
      
      if (response.success) {
        alert('Loan application submitted successfully! You will be notified once it has been reviewed.');
        
        // Reset form
        setFormData({
          requestedAmount: '',
          purpose: '',
          purposeDescription: ''
        });
        
        // Recheck eligibility
        await checkEligibility();
      } else {
        alert(response.message || 'Failed to submit loan application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error.response?.data?.message || 'Failed to submit loan application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loan-application">
      <div className="loan-application-card">
        <div className="loan-application-header">
          <h1>Loan Application</h1>
          <p>Apply for a loan up to KSh 20,000</p>
        </div>

        {!canApply ? (
          <div className="eligibility-message">
            <div className="eligibility-icon">⚠️</div>
            <h3>Unable to Apply</h3>
            <p>{eligibilityMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="loan-application-form">
            <div className="form-section">
              <h3>Loan Details</h3>
              
              <div className="form-group">
                <label htmlFor="requestedAmount">Loan Amount (KSh)</label>
                <input
                  type="number"
                  id="requestedAmount"
                  name="requestedAmount"
                  value={formData.requestedAmount}
                  onChange={handleInputChange}
                  min="1000"
                  max="20000"
                  step="100"
                  placeholder="Enter amount (1,000 - 20,000)"
                  className={errors.requestedAmount ? 'error' : ''}
                />
                {errors.requestedAmount && (
                  <span className="error-text">{errors.requestedAmount}</span>
                )}
                <span className="help-text">Minimum: KSh 1,000 | Maximum: KSh 20,000</span>
              </div>

              <div className="form-group">
                <label htmlFor="purpose">Purpose</label>
                <select
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className={errors.purpose ? 'error' : ''}
                >
                  <option value="">Select loan purpose</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="medical">Medical</option>
                  <option value="personal">Personal</option>
                  <option value="emergency">Emergency</option>
                  <option value="home_improvement">Home Improvement</option>
                  <option value="other">Other</option>
                </select>
                {errors.purpose && (
                  <span className="error-text">{errors.purpose}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="purposeDescription">Description (Optional)</label>
                <textarea
                  id="purposeDescription"
                  name="purposeDescription"
                  value={formData.purposeDescription}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Provide additional details about your loan purpose..."
                />
              </div>
            </div>

            {formData.requestedAmount && (
              <div className="loan-summary">
                <h4>Loan Summary</h4>
                <div className="summary-row">
                  <span>Requested Amount:</span>
                  <span>KSh {loanDetails.amount.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Processing Fee:</span>
                  <span>KSh {loanDetails.fee.toLocaleString()}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>KSh {loanDetails.total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="fee-structure">
              <h4>Fee Structure</h4>
              <div className="fee-table">
                <div className="fee-row">
                  <span>KSh 1,000 - 5,000:</span>
                  <span>KSh 100</span>
                </div>
                <div className="fee-row">
                  <span>KSh 5,001 - 10,000:</span>
                  <span>KSh 200</span>
                </div>
                <div className="fee-row">
                  <span>KSh 10,001 - 15,000:</span>
                  <span>KSh 300</span>
                </div>
                <div className="fee-row">
                  <span>KSh 15,001 - 20,000:</span>
                  <span>KSh 500</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading || !canApply}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoanApplication;