import { format, formatDistanceToNow } from 'date-fns';
import { STATUS_COLORS } from './constants';

/**
 * Format date to a readable string (e.g., Oct 24, 2023)
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy');
};

/**
 * Format date to relative time (e.g., 2 hours ago)
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate long text with ellipses
 */
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * Get color/style for specific complaint status
 */
export const getStatusStyles = (status) => {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Generate a Cloudinary thumbnail URL via transformations
 */
export const getThumbnail = (url, width = 200, height = 200) => {
  if (!url) return '';
  // Assuming standard Cloudinary URL structure
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,g_auto/`);
};

/**
 * Role Checkers
 */
export const isAdmin = (user) => user?.role === 'admin';
export const isStaff = (user) => user?.role === 'staff';
export const isResident = (user) => user?.role === 'resident';

/**
 * Calculate delay in hours
 */
export const calculateDelayHours = (deadline) => {
  const now = new Date();
  const target = new Date(deadline);
  if (now <= target) return 0;
  const diff = now - target;
  return Math.floor(diff / (1000 * 60 * 60));
};