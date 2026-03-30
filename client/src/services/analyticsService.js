import api from './api';

export const analyticsService = {
  getDashboardStats: (params) => api.get('/analytics/dashboard', { params }),

  getComplaintsTrend: (params) =>
    api.get('/analytics/complaints-trend', { params }),

  getCategoryAnalytics: (params) => api.get('/analytics/categories', { params }),

  getStaffPerformance: (params) => api.get('/analytics/staff-performance', { params }),

  getDelayAnalytics: (params) => api.get('/analytics/delays', { params }),

  getRatingAnalytics: (params) => api.get('/analytics/ratings', { params }),
};

export default analyticsService;
