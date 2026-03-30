import api from './api';

export const authService = {
  // Register a new user
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  // Login user
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Logout user
  logout: () => {
    return api.post('/auth/logout');
  },

  // Get current user profile
  getMe: () => {
    return api.get('/auth/me');
  },

  // Update profile details (Handles Multipart/Form-Data for images)
  updateProfile: (formData) => {
    return api.put('/auth/update-profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Change account password
  changePassword: (passwordData) => {
    return api.put('/auth/change-password', passwordData);
  },

  // Verify if the current token is valid
  verifyToken: () => {
    return api.get('/auth/verify');
  },

  // Forgot password - Send OTP
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  // Verify OTP
  verifyOtp: (email, otp) => {
    return api.post('/auth/verify-otp', { email, otp });
  },

  // Reset password
  resetPassword: (data) => {
    return api.post('/auth/reset-password', data);
  }
};

export default authService;