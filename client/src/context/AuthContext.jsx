import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create Auth Context
export const AuthContext = createContext();

// Base API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Configure axios defaults
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Set credentials for cookies (important for httpOnly)
  axios.defaults.withCredentials = true;

  // 1. Check Authentication Status (On Mount)
  const checkAuthStatus = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/me`);
      
      if (response.data.success) {
        setUser(response.data.data.user);
        setIsAuthenticated(true);
      } else {
        // If server says token is invalid
        handleLogoutLocal();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      handleLogoutLocal();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // 2. Login Function
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      if (response.data.success) {
        const { user: userData, token: userToken } = response.data.data;
        
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Set axios header for subsequent requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        
        return { success: true, user: userData };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  // 2b. Google login using ID token
  const googleLogin = async (idToken) => {
    try {
      const response = await axios.post(`${API_URL}/auth/google`, { id_token: idToken });

      if (response.data.success) {
        const { user: userData, token: userToken } = response.data.data;

        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        setIsAuthenticated(true);

        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;

        return { success: true, user: userData };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed';
      return { success: false, message };
    }
  };

  // 3. Register Function
  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      if (response.data.success) {
        const { user: newUser, token: userToken } = response.data.data;
        
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(newUser);
        setIsAuthenticated(true);
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        
        return { success: true, user: newUser };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  // 4. Logout Function
  const logout = async () => {
    try {
      // Notify backend to clear cookie
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error on server:', error);
    } finally {
      handleLogoutLocal();
      toast.success('Logged out successfully');
    }
  };

  // Internal helper to clear state
  const handleLogoutLocal = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  // 5. Update Profile
  const updateProfile = async (formData) => {
    try {
      // Do NOT set Content-Type for FormData; the browser will add the correct boundary
      const response = await axios.put(`${API_URL}/auth/update-profile`, formData);
      
      if (response.data.success) {
        setUser(response.data.data.user);
        toast.success('Profile updated successfully');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // 6. Change Password
  const changePassword = async (passwordData) => {
    try {
      const response = await axios.put(`${API_URL}/auth/change-password`, passwordData);
      if (response.data.success) {
        toast.success('Password changed successfully');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        googleLogin,
        register,
        logout,
        updateProfile,
        changePassword,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};