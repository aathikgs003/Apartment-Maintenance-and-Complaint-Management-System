import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

/**
 * Custom hook to access Notification context
 * @returns {Object} Notifications state and management methods
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);

  // Safety check to ensure the hook is used within the Provider
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
};

export default useNotifications;