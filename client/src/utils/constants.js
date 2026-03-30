// User Roles
export const USER_ROLES = {
  RESIDENT: 'resident',
  STAFF: 'staff',
  ADMIN: 'admin',
};

// Complaint Categories
export const COMPLAINT_CATEGORIES = [
  'Water',
  'Power',
  'Lift',
  'Cleaning',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Pest Control',
  'Security',
  'Other',
];

// Staff expertise categories (mirror server-side STAFF_EXPERTISE)
export const STAFF_EXPERTISE = [
  // Mirror server-side: include all complaint categories and lift maintenance
  ...COMPLAINT_CATEGORIES,
  'Lift Maintenance',
];

// Complaint Statuses
export const COMPLAINT_STATUS = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_RECEIVED: 'Payment Received',
  PAYMENT_COMPLETED: 'Payment Completed',
  CLOSED: 'Closed',
};

// Payment Modes
export const PAYMENT_MODE = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

// Complaint Status Colors (Tailwind Classes)
export const STATUS_COLORS = {
  [COMPLAINT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [COMPLAINT_STATUS.ASSIGNED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [COMPLAINT_STATUS.IN_PROGRESS]: 'bg-purple-100 text-purple-800 border-purple-200',
  [COMPLAINT_STATUS.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [COMPLAINT_STATUS.PAYMENT_PENDING]: 'bg-orange-100 text-orange-800 border-orange-200',
  [COMPLAINT_STATUS.PAYMENT_RECEIVED]: 'bg-teal-100 text-teal-800 border-teal-200',
  [COMPLAINT_STATUS.PAYMENT_COMPLETED]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [COMPLAINT_STATUS.CLOSED]: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Complaint Priorities
export const COMPLAINT_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const PRIORITY_COLORS = {
  [COMPLAINT_PRIORITY.LOW]: 'bg-gray-100 text-gray-600',
  [COMPLAINT_PRIORITY.MEDIUM]: 'bg-orange-100 text-orange-700',
  [COMPLAINT_PRIORITY.HIGH]: 'bg-red-100 text-red-700',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  COMPLAINT_RAISED: 'complaint_raised',
  STAFF_ASSIGNED: 'staff_assigned',
  STATUS_UPDATED: 'status_updated',
  DEADLINE_EXCEEDED: 'deadline_exceeded',
  WORK_COMPLETED: 'work_completed',
  COMPLAINT_CLOSED: 'complaint_closed',
  RATING_RECEIVED: 'rating_received',
};

// File Upload Limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_COMPLAINT_IMAGES: 5,
  MAX_PROOF_IMAGES: 3,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  DEFAULT_PAGE: 1,
};