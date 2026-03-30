import { body, param, query, validationResult } from 'express-validator';
import {
  VALIDATION,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITY_ARRAY,
  COMPLAINT_STATUS_ARRAY,
  USER_ROLES_ARRAY,
  STAFF_EXPERTISE,
  HTTP_STATUS,
} from '../config/constants.js';

// ====================================
// VALIDATION RESULT HANDLER
// ====================================

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value !== undefined ? err.value : undefined,
    }));

    // Log validation details for debugging
    console.error('[Validation Failed]', {
      path: req.path,
      method: req.method,
      body: req.body,
      errors: errorMessages,
    });

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }

  next();
};

// ====================================
// AUTH VALIDATORS
// ====================================

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage(VALIDATION.EMAIL_MESSAGE)
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
    .matches(VALIDATION.PASSWORD_REGEX)
    .withMessage(VALIDATION.PASSWORD_MESSAGE),

  body('role')
    .optional()
    .isIn(['resident', 'staff'])
    .withMessage('Role must be either resident or staff'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(VALIDATION.PHONE_REGEX)
    .withMessage(VALIDATION.PHONE_MESSAGE),

  body('flatNumber')
    .if(body('role').equals('resident'))
    .trim()
    .notEmpty()
    .withMessage('Flat number is required for residents')
    .matches(VALIDATION.FLAT_NUMBER_REGEX)
    .withMessage(VALIDATION.FLAT_NUMBER_MESSAGE),

  body('expertise')
    .optional()
    .custom((value) => {
      const expertiseArray = Array.isArray(value) ? value : [value];
      const valid = expertiseArray.every((exp) => STAFF_EXPERTISE.includes(exp));
      if (!valid) {
        throw new Error(`Expertise must be one of: ${STAFF_EXPERTISE.join(', ')}`);
      }
      return true;
    }),

  handleValidation,
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidation,
];

export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('phone')
    .optional()
    .trim()
    .matches(VALIDATION.PHONE_REGEX)
    .withMessage(VALIDATION.PHONE_MESSAGE),

  body('flatNumber')
    .optional()
    .trim()
    .matches(VALIDATION.FLAT_NUMBER_REGEX)
    .withMessage(VALIDATION.FLAT_NUMBER_MESSAGE),

  body('expertise')
    .optional()
    .custom((value) => {
      const expertiseArray = Array.isArray(value) ? value : [value];
      const valid = expertiseArray.every((exp) => STAFF_EXPERTISE.includes(exp));
      if (!valid) {
        throw new Error(`Expertise must be one of: ${STAFF_EXPERTISE.join(', ')}`);
      }
      return true;
    }),

  handleValidation,
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
    .matches(VALIDATION.PASSWORD_REGEX)
    .withMessage(VALIDATION.PASSWORD_MESSAGE)
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),

  handleValidation,
];

// ====================================
// COMPLAINT VALIDATORS
// ====================================

export const validateCreateComplaint = [
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(COMPLAINT_CATEGORIES)
    .withMessage(`Category must be one of: ${COMPLAINT_CATEGORIES.join(', ')}`),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({
      min: VALIDATION.DESCRIPTION_MIN_LENGTH,
      max: VALIDATION.DESCRIPTION_MAX_LENGTH,
    })
    .withMessage(
      `Description must be between ${VALIDATION.DESCRIPTION_MIN_LENGTH} and ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`
    ),

  body('priority')
    .optional()
    .isIn(COMPLAINT_PRIORITY_ARRAY)
    .withMessage(`Priority must be one of: ${COMPLAINT_PRIORITY_ARRAY.join(', ')}`),

  // Preferred Visit Time validations
  body('preferredVisitAvailability')
    .notEmpty()
    .withMessage('Preferred visit availability is required')
    .isIn(['Anytime', 'Lunch Time', 'Break Time', 'Specific Time'])
    .withMessage('Invalid preferred visit availability option'),

  body('preferredVisitFrom')
    .optional()
    .custom((value, { req }) => {
      if (req.body.preferredVisitAvailability === 'Specific Time') {
        if (!value) throw new Error('Start time is required when Specific Time is selected');
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Start time must be in HH:MM format');
      }
      return true;
    }),

  body('preferredVisitTo')
    .optional()
    .custom((value, { req }) => {
      if (req.body.preferredVisitAvailability === 'Specific Time') {
        if (!value) throw new Error('End time is required when Specific Time is selected');
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('End time must be in HH:MM format');
        // If both provided, ensure start < end
        const from = req.body.preferredVisitFrom;
        if (from && value && from >= value) throw new Error('Start time must be earlier than end time');
      }
      return true;
    }),

  handleValidation,
];

export const validateUpdateComplaint = [
  body('description')
    .optional()
    .trim()
    .isLength({
      min: VALIDATION.DESCRIPTION_MIN_LENGTH,
      max: VALIDATION.DESCRIPTION_MAX_LENGTH,
    })
    .withMessage(
      `Description must be between ${VALIDATION.DESCRIPTION_MIN_LENGTH} and ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`
    ),

  body('category')
    .optional()
    .trim()
    .isIn(COMPLAINT_CATEGORIES)
    .withMessage(`Category must be one of: ${COMPLAINT_CATEGORIES.join(', ')}`),

  body('priority')
    .optional()
    .isIn(COMPLAINT_PRIORITY_ARRAY)
    .withMessage(`Priority must be one of: ${COMPLAINT_PRIORITY_ARRAY.join(', ')}`),

  // Optional preferred visit updates
  body('preferredVisitAvailability')
    .optional()
    .isIn(['Anytime', 'Lunch Time', 'Break Time', 'Specific Time'])
    .withMessage('Invalid preferred visit availability option'),

  body('preferredVisitFrom')
    .optional()
    .custom((value, { req }) => {
      if (req.body.preferredVisitAvailability === 'Specific Time') {
        if (!value) throw new Error('Start time is required when Specific Time is selected');
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Start time must be in HH:MM format');
      }
      return true;
    }),

  body('preferredVisitTo')
    .optional()
    .custom((value, { req }) => {
      if (req.body.preferredVisitAvailability === 'Specific Time') {
        if (!value) throw new Error('End time is required when Specific Time is selected');
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('End time must be in HH:MM format');
        const from = req.body.preferredVisitFrom;
        if (from && value && from >= value) throw new Error('Start time must be earlier than end time');
      }
      return true;
    }),

  handleValidation,
];

export const validateAssignComplaint = [
  body('staffId')
    .notEmpty()
    .withMessage('Staff ID is required')
    .isMongoId()
    .withMessage('Invalid Staff ID format'),

  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid deadline format. Use ISO 8601 format.')
    .custom((value) => {
      const deadline = new Date(value);
      if (deadline <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),

  body('priority')
    .optional()
    .isIn(COMPLAINT_PRIORITY_ARRAY)
    .withMessage(`Priority must be one of: ${COMPLAINT_PRIORITY_ARRAY.join(', ')}`),

  handleValidation,
];

export const validateUpdateStatus = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['In Progress', 'Completed'])
    .withMessage('Status must be either "In Progress" or "Completed"'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),

  handleValidation,
];

export const validateRating = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: VALIDATION.RATING_MIN, max: VALIDATION.RATING_MAX })
    .withMessage(`Rating must be between ${VALIDATION.RATING_MIN} and ${VALIDATION.RATING_MAX}`),

  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback cannot exceed 500 characters'),

  handleValidation,
];

// ====================================
// USER VALIDATORS
// ====================================

export const validateCreateUser = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage(VALIDATION.EMAIL_MESSAGE)
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(USER_ROLES_ARRAY)
    .withMessage(`Role must be one of: ${USER_ROLES_ARRAY.join(', ')}`),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(VALIDATION.PHONE_REGEX)
    .withMessage(VALIDATION.PHONE_MESSAGE),

  body('flatNumber')
    .if(body('role').equals('resident'))
    .trim()
    .notEmpty()
    .withMessage('Flat number is required for residents'),

  body('expertise')
    .if(body('role').equals('staff'))
    .optional()
    .custom((value) => {
      const expertiseArray = Array.isArray(value) ? value : [value];
      const valid = expertiseArray.every((exp) => STAFF_EXPERTISE.includes(exp));
      if (!valid) {
        throw new Error(`Expertise must be one of: ${STAFF_EXPERTISE.join(', ')}`);
      }
      return true;
    }),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  handleValidation,
];

export const validateUpdateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage(VALIDATION.EMAIL_MESSAGE)
    .normalizeEmail(),

  body('role')
    .optional()
    .isIn(USER_ROLES_ARRAY)
    .withMessage(`Role must be one of: ${USER_ROLES_ARRAY.join(', ')}`),

  body('phone')
    .optional()
    .trim()
    .matches(VALIDATION.PHONE_REGEX)
    .withMessage(VALIDATION.PHONE_MESSAGE),

  body('flatNumber')
    .optional()
    .trim()
    .matches(VALIDATION.FLAT_NUMBER_REGEX)
    .withMessage(VALIDATION.FLAT_NUMBER_MESSAGE),

  body('expertise')
    .optional()
    .custom((value) => {
      const expertiseArray = Array.isArray(value) ? value : [value];
      const valid = expertiseArray.every((exp) => STAFF_EXPERTISE.includes(exp));
      if (!valid) {
        throw new Error(`Expertise must be one of: ${STAFF_EXPERTISE.join(', ')}`);
      }
      return true;
    }),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  handleValidation,
];

export const validateResetPassword = [
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`),

  handleValidation,
];

// ====================================
// COMMON VALIDATORS
// ====================================

export const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),

  handleValidation,
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidation,
];

export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const start = new Date(req.query.startDate);
        const end = new Date(value);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  handleValidation,
];

// ====================================
// CUSTOM SANITIZERS
// ====================================

export const sanitizeInput = [
  body('*').trim().escape(),
];

export const sanitizeQuery = [
  query('*').trim().escape(),
];

// ====================================
// EXPORT ALL VALIDATORS
// ====================================

export default {
  // Auth
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  
  // Complaint
  validateCreateComplaint,
  validateUpdateComplaint,
  validateAssignComplaint,
  validateUpdateStatus,
  validateRating,
  
  // User
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
  
  // Common
  validateMongoId,
  validatePagination,
  validateDateRange,
  
  // Sanitizers
  sanitizeInput,
  sanitizeQuery,
};