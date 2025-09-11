import api from '../utils/api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.success) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.success) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  async logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  async getProfile() {
    return await api.get('/auth/profile');
  },

  async updateProfile(userData) {
    return await api.put('/auth/profile', userData);
  },

  async changePassword(currentPassword, newPassword) {
    return await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    return await api.post('/auth/upload-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};