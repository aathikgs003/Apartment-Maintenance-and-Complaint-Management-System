import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to access Authentication context
 * @returns {Object} User data and auth methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  // Safety check to ensure the hook is used within the Provider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;