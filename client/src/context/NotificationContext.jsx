import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { io } from 'socket.io-client';
export const NotificationContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/notifications`);
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch count only (for lightweight updates)
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await axios.get(`${API_URL}/notifications/unread-count`);
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated]);

  // Initial fetch when user logs in and Setup WebSockets
  useEffect(() => {
    let socket;

    if (isAuthenticated && user) {
      fetchNotifications();

      // Connect specifically to our local/API backend with socket
      // Using generic logic assuming window.location or API URL origin
      const socketUrl = API_URL.replace('/api', '');
      socket = io(socketUrl, {
        withCredentials: true,
      });

      socket.on('connect', () => {
        socket.emit('register', user._id || user.id);
      });

      socket.on('new_notification', (newNotif) => {
        // Sound or any visual feedback can go here
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      // Keeping a slow slow polling fallback just in case socket disconnects (e.g. 5 minutes)
      const interval = setInterval(fetchUnreadCount, 300000);

      return () => {
        clearInterval(interval);
        if (socket) socket.disconnect();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user, fetchNotifications, fetchUnreadCount]);

  // 2. Mark Single as Read
  const markAsRead = async (notificationId) => {
    try {
      const response = await axios.put(`${API_URL}/notifications/${notificationId}/read`);
      if (response.data.success) {
        // Optimistic UI update
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // 3. Mark All as Read
  const markAllAsRead = async () => {
    try {
      const response = await axios.put(`${API_URL}/notifications/read-all`);
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // 4. Delete Notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await axios.delete(`${API_URL}/notifications/${notificationId}`);
      if (response.data.success) {
        const deletedNotification = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // 5. Clear Read Notifications
  const clearRead = async () => {
    try {
      await axios.delete(`${API_URL}/notifications/clear-read`);
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch (error) {
      console.error('Error clearing read notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};