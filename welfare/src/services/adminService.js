import api from '../utils/api';

export const adminService = {
  async getDashboardStats() {
    return await api.get('/admin/dashboard');
  },

  async getAllApplications(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/admin/applications${params ? `?${params}` : ''}`);
  },

  async getApplicationDetails(applicationId) {
    return await api.get(`/admin/applications/${applicationId}`);
  },

  async assignOfficer(applicationId, officerId) {
    return await api.post(`/admin/applications/${applicationId}/assign`, {
      officerId,
    });
  },

  async reviewApplication(applicationId, reviewData) {
    return await api.post(`/admin/applications/${applicationId}/review`, reviewData);
  },

  async createLoanProduct(productData) {
    return await api.post('/admin/loan-products', productData);
  },

  async updateLoanProduct(productId, updates) {
    return await api.put(`/admin/loan-products/${productId}`, updates);
  },

  async getAllLoans(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/admin/loans${params ? `?${params}` : ''}`);
  },

  async getLoanOfficers() {
    return await api.get('/admin/loan-officers');
  },

  async getAllUsers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/admin/users${params ? `?${params}` : ''}`);
  },

  async updateLoanPaymentStatus(loanId, isPaid) {
    return await api.put(`/admin/loans/${loanId}/payment-status`, { isPaid });
  },

  async updateLoanAmountPaid(loanId, amountPaid) {
    return await api.put(`/admin/loans/${loanId}/payment-status`, { amountPaid });
  },

  async getContributions(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/admin/contributions${params ? `?${params}` : ''}`);
  },

  async createContribution(contributionData) {
    return await api.post('/admin/contributions', contributionData);
  },

  async updateContribution(contributionId, updates) {
    return await api.put(`/admin/contributions/${contributionId}`, updates);
  },

  async getFinancialMetrics() {
    return await api.get('/admin/financial-metrics');
  },
};