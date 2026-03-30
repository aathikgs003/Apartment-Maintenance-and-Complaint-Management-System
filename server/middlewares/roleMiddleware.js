import { MESSAGES, HTTP_STATUS, USER_ROLES } from '../config/constants.js';

// ====================================
// @desc    Authorize specific roles
// @param   ...roles - Allowed roles (e.g., 'admin', 'staff', 'resident')
// @usage   router.get('/route', protect, authorize('admin', 'staff'), controller)
// ====================================
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
        details: `This action requires one of the following roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

// ====================================
// @desc    Check if user is admin
// @usage   router.get('/route', protect, isAdmin, controller)
// ====================================
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.ERROR.UNAUTHORIZED,
    });
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
};

// ====================================
// @desc    Check if user is staff
// @usage   router.get('/route', protect, isStaff, controller)
// ====================================
export const isStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.ERROR.UNAUTHORIZED,
    });
  }

  if (req.user.role !== USER_ROLES.STAFF) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Staff access required',
    });
  }

  next();
};

// ====================================
// @desc    Check if user is resident
// @usage   router.get('/route', protect, isResident, controller)
// ====================================
export const isResident = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.ERROR.UNAUTHORIZED,
    });
  }

  if (req.user.role !== USER_ROLES.RESIDENT) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Resident access required',
    });
  }

  next();
};

// ====================================
// @desc    Check if user is admin or staff
// @usage   router.get('/route', protect, isAdminOrStaff, controller)
// ====================================
export const isAdminOrStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.ERROR.UNAUTHORIZED,
    });
  }

  if (![USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(req.user.role)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Admin or Staff access required',
    });
  }

  next();
};

// ====================================
// @desc    Check if user owns the resource or is admin
// @param   resourceUserIdField - Field name in req.params or req.body containing resource owner ID
// @usage   router.get('/route/:userId', protect, isOwnerOrAdmin('userId'), controller)
// ====================================
export const isOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
      });
    }

    // Admin can access anything
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    // Get resource owner ID from params or body
    const resourceOwnerId = 
      req.params[resourceUserIdField] || 
      req.body[resourceUserIdField];

    // Check if current user is the owner
    if (resourceOwnerId && req.user.id === resourceOwnerId.toString()) {
      return next();
    }

    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: MESSAGES.ERROR.FORBIDDEN,
    });
  };
};

// ====================================
// @desc    Check user has specific expertise (for staff)
// @param   ...requiredExpertise - Required expertise categories
// @usage   router.get('/route', protect, hasExpertise('Plumbing', 'Electrical'), controller)
// ====================================
export const hasExpertise = (...requiredExpertise) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
      });
    }

    // Only applicable for staff
    if (req.user.role !== USER_ROLES.STAFF) {
      return next();
    }

    // Check if staff has any of the required expertise
    const userExpertise = req.user.expertise || [];
    const hasRequired = requiredExpertise.some((exp) =>
      userExpertise.includes(exp)
    );

    if (!hasRequired) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `This task requires expertise in: ${requiredExpertise.join(', ')}`,
      });
    }

    next();
  };
};

export default {
  authorize,
  isAdmin,
  isStaff,
  isResident,
  isAdminOrStaff,
  isOwnerOrAdmin,
  hasExpertise,
};