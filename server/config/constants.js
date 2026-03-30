// ====================================
// APPLICATION CONSTANTS
// ====================================

// User Roles
export const USER_ROLES = {
  RESIDENT: 'resident',
  STAFF: 'staff',
  ADMIN: 'admin',
};

export const USER_ROLES_ARRAY = Object.values(USER_ROLES);

// Staff Expertise Categories
export const STAFF_EXPERTISE = [
  // Allow staff expertise to include any complaint category plus lift maintenance
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
  'Lift Maintenance',
];

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

// Complaint Status
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

export const COMPLAINT_STATUS_ARRAY = Object.values(COMPLAINT_STATUS);

// Payment Modes
export const PAYMENT_MODE = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
};

export const PAYMENT_MODE_ARRAY = Object.values(PAYMENT_MODE);

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

export const PAYMENT_STATUS_ARRAY = Object.values(PAYMENT_STATUS);

// Complaint Priority
export const COMPLAINT_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const COMPLAINT_PRIORITY_ARRAY = Object.values(COMPLAINT_PRIORITY);

// Notification Types
export const NOTIFICATION_TYPES = {
  COMPLAINT_RAISED: 'complaint_raised',
  STAFF_ASSIGNED: 'staff_assigned',
  STATUS_UPDATED: 'status_updated',
  DEADLINE_EXCEEDED: 'deadline_exceeded',
  WORK_COMPLETED: 'work_completed',
  COMPLAINT_CLOSED: 'complaint_closed',
  RATING_RECEIVED: 'rating_received',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_RECEIVED: 'payment_received',
};

export const NOTIFICATION_TYPES_ARRAY = Object.values(NOTIFICATION_TYPES);

// ====================================
// VALIDATION CONSTANTS
// ====================================

export const VALIDATION = {
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PASSWORD_MESSAGE:
    'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number',

  // Phone validation (Indian format)
  PHONE_REGEX: /^[6-9]\d{9}$/,
  PHONE_MESSAGE: 'Phone number must be a valid 10-digit Indian mobile number',

  // Email validation
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  EMAIL_MESSAGE: 'Please provide a valid email address',

  // Flat number validation
  FLAT_NUMBER_REGEX: /^[A-Za-z0-9-]+$/,
  FLAT_NUMBER_MESSAGE: 'Flat number must be alphanumeric',

  // Complaint description
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 500,

  // Rating
  RATING_MIN: 1,
  RATING_MAX: 5,

  // Name
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

// ====================================
// FILE UPLOAD CONSTANTS
// ====================================

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  MAX_FILES_PER_COMPLAINT: 5,
  MAX_PROOF_IMAGES: 3,
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
};

// ====================================
// JWT & AUTH CONSTANTS
// ====================================

export const AUTH = {
  JWT_EXPIRE: '7d',
  JWT_COOKIE_EXPIRE: 7, // days
  BCRYPT_SALT_ROUNDS: 10,
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },
};

// ====================================
// RATE LIMITING CONSTANTS
// ====================================

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
  AUTH_WINDOW_MS: 60 * 60 * 1000, // 1 hour for auth routes
  AUTH_MAX_REQUESTS: 10, // limit each IP to 10 auth requests per hour
  MESSAGE: 'Too many requests from this IP, please try again later.',
};

// ====================================
// PAGINATION CONSTANTS
// ====================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// ====================================
// DEADLINE CONSTANTS
// ====================================

export const DEADLINE = {
  DEFAULT_HOURS: 48, // Default deadline in hours if not set
  CHECK_INTERVAL_HOURS: 1, // Check for delayed complaints every hour
  WARNING_HOURS_BEFORE: 6, // Send warning notification 6 hours before deadline
};

// ====================================
// API RESPONSE MESSAGES
// ====================================

export const MESSAGES = {
  // Success messages
  SUCCESS: {
    REGISTERED: 'User registered successfully',
    LOGGED_IN: 'Logged in successfully',
    LOGGED_OUT: 'Logged out successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully',
    COMPLAINT_CREATED: 'Complaint raised successfully',
    COMPLAINT_UPDATED: 'Complaint updated successfully',
    COMPLAINT_DELETED: 'Complaint deleted successfully',
    COMPLAINT_ASSIGNED: 'Complaint assigned successfully',
    STATUS_UPDATED: 'Status updated successfully',
    COMPLAINT_CLOSED: 'Complaint closed successfully',
    RATING_SUBMITTED: 'Rating submitted successfully',
    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User updated successfully',
    USER_DELETED: 'User deleted successfully',
    NOTIFICATION_READ: 'Notification marked as read',
    ALL_NOTIFICATIONS_READ: 'All notifications marked as read',
  },

  // Error messages
  ERROR: {
    UNAUTHORIZED: 'Not authorized to access this resource',
    FORBIDDEN: 'You do not have permission to perform this action',
    NOT_FOUND: 'Resource not found',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_EXISTS: 'Email already registered',
    USER_NOT_FOUND: 'User not found',
    COMPLAINT_NOT_FOUND: 'Complaint not found',
    NOTIFICATION_NOT_FOUND: 'Notification not found',
    INVALID_TOKEN: 'Invalid or expired token',
    TOKEN_MISSING: 'No token provided, authorization denied',
    VALIDATION_ERROR: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit',
    INVALID_FILE_TYPE: 'Invalid file type. Only images are allowed',
    MAX_FILES_EXCEEDED: 'Maximum number of files exceeded',
    ALREADY_RATED: 'You have already rated this complaint',
    CANNOT_RATE: 'Cannot rate complaint that is not completed or closed',
    CANNOT_ASSIGN: 'Cannot assign complaint in current status',
    CANNOT_UPDATE_STATUS: 'Cannot update status of this complaint',
    STAFF_NOT_FOUND: 'Staff member not found',
    INVALID_STATUS: 'Invalid status transition',
    PASSWORD_MISMATCH: 'Current password is incorrect',
  },
};

// ====================================
// CLOUDINARY FOLDERS
// ====================================

export const CLOUDINARY_FOLDERS = {
  COMPLAINTS: 'apartment-maintenance/complaints',
  PROOF_IMAGES: 'apartment-maintenance/proof-images',
  PROFILE_IMAGES: 'apartment-maintenance/profiles',
};

// ====================================
// CRON JOB SCHEDULES
// ====================================

export const CRON_SCHEDULES = {
  // Check for delayed complaints every hour
  CHECK_DELAYED: '0 * * * *',
  // Send deadline warnings every 30 minutes
  DEADLINE_WARNING: '*/30 * * * *',
  // Clean old notifications daily at midnight
  CLEAN_NOTIFICATIONS: '0 0 * * *',
};

// ====================================
// HTTP STATUS CODES
// ====================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ====================================
// DEFAULT VALUES
// ====================================

export const DEFAULTS = {
  COMPLAINT_PRIORITY: COMPLAINT_PRIORITY.MEDIUM,
  COMPLAINT_STATUS: COMPLAINT_STATUS.PENDING,
  USER_ROLE: USER_ROLES.RESIDENT,
  IS_ACTIVE: true,
  IS_READ: false,
  IS_DELAYED: false,
};

// ====================================
// EXPORT ALL CONSTANTS
// ====================================

export default {
  USER_ROLES,
  USER_ROLES_ARRAY,
  STAFF_EXPERTISE,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUS,
  COMPLAINT_STATUS_ARRAY,
  COMPLAINT_PRIORITY,
  COMPLAINT_PRIORITY_ARRAY,
  PAYMENT_MODE,
  PAYMENT_MODE_ARRAY,
  PAYMENT_STATUS,
  PAYMENT_STATUS_ARRAY,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPES_ARRAY,
  VALIDATION,
  FILE_UPLOAD,
  AUTH,
  RATE_LIMIT,
  PAGINATION,
  DEADLINE,
  MESSAGES,
  CLOUDINARY_FOLDERS,
  CRON_SCHEDULES,
  HTTP_STATUS,
  DEFAULTS,
};