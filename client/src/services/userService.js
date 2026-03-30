import api from './api';

export const userService = {
  getAllUsers: (params) => api.get('/users', { params }),

  getUserById: (id) => api.get(`/users/${id}`),

  createUser: (userData) => api.post('/users', userData),

  updateUser: (id, data) => api.put(`/users/${id}`, data),

  deleteUser: (id) => api.delete(`/users/${id}`),

  toggleUserStatus: (id) => api.put(`/users/${id}/toggle-status`),

  resetPassword: (id, newPassword) => api.put(`/users/${id}/reset-password`, { newPassword }),

  // Get staff available for assignment (filters: expertise, availability)
  getAvailableStaff: (params) => api.get('/users/staff/available', { params }),
};

export default userService;
