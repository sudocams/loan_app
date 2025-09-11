import api from '../utils/api';

export const adminService = {
  async getDashboardStats() {
    return await api.get('/users/dashboard');
  },

  async getAllApplications(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/users/applications${params ? `?${params}` : ''}`);
  },

  async getApplicationDetails(applicationId) {
    return await api.get(`/users/applications/${applicationId}`);
  },

  async assignOfficer(applicationId, officerId) {
    return await api.put(`/users/applications/${applicationId}/assign`, {
      officerId,
    });
  },

  async reviewApplication(applicationId, reviewData) {
    return await api.put(`/users/applications/${applicationId}/review`, reviewData);
  },

  async createLoanProduct(productData) {
    return await api.post('/users/loan-products', productData);
  },

  async updateLoanProduct(productId, updates) {
    return await api.put(`/users/loan-products/${productId}`, updates);
  },

  async getAllLoans(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/users/loans${params ? `?${params}` : ''}`);
  },

  async getLoanOfficers() {
    return await api.get('/users/officers');
  },

  async getAllApplications() {
    return await api.get('/applications/all-loans');
  },
};