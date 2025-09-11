import api from '../utils/api';

export const applicationService = {
  async createApplication(applicationData) {
    return await api.post('/applications', applicationData);
  },

  async getUserApplications(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/applications/my-applications${params ? `?${params}` : ''}`);
  },

  async getApplication(applicationId) {
    return await api.get(`/applications/${applicationId}`);
  },

  async updateApplication(applicationId, updates) {
    return await api.put(`/applications/${applicationId}`, updates);
  },

  async submitApplication(applicationId) {
    return await api.post(`/applications/${applicationId}/submit`);
  },

  async uploadDocument(applicationId, file, docType) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', docType);
    
    return await api.post(`/applications/${applicationId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async deleteDocument(applicationId, docType) {
    return await api.delete(`/applications/${applicationId}/documents/${docType}`);
  },

  async checkLoanEligibility() {
    return await api.get('/applications/check-eligibility');
  },

  async submitLoanApplication(applicationData) {
    return await api.post('/applications/submit-loan', applicationData);
  },
};