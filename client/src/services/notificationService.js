import api from './api';

export const notificationService = {
  // Fetch all notifications for the user (paginated)
  getNotifications: (params) => {
    return api.get('/notifications', { params });
  },

  // Get just the count of unread notifications
  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },

  // Mark a specific notification as seen
  markAsRead: (id) => {
    return api.put(`/notifications/${id}/read`);
  },

  // Mark all notifications as seen
  markAllAsRead: () => {
    return api.put('/notifications/read-all');
  },

  // Delete a specific notification
  deleteNotification: (id) => {
    return api.delete(`/notifications/${id}`);
  },

  // Clear all notifications that have been read
  clearRead: () => {
    return api.delete('/notifications/clear-read');
  },

  // Get detailed stats about notifications
  getNotificationStats: () => {
    return api.get('/notifications/stats');
  }
};

export default notificationService;