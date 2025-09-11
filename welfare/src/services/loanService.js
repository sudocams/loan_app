import api from '../utils/api';

export const loanService = {
  async getLoanProducts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/loans/products${params ? `?${params}` : ''}`);
  },

  async getLoanProduct(id) {
    return await api.get(`/loans/products/${id}`);
  },

  async calculateLoanTerms(loanProductId, amount, term) {
    return await api.post('/loans/calculate', {
      loanProductId,
      amount,
      term,
    });
  },

  async getUserLoans(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/loans/my-loans${params ? `?${params}` : ''}`);
  },

  async getLoanDetails(loanId) {
    return await api.get(`/loans/my-loans/${loanId}`);
  },

  async makePayment(loanId, paymentData) {
    return await api.post(`/loans/my-loans/${loanId}/payments`, paymentData);
  },

  async getPaymentHistory(loanId, page = 1, limit = 10) {
    return await api.get(`/loans/my-loans/${loanId}/payments?page=${page}&limit=${limit}`);
  },
};