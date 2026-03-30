import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { MESSAGES, HTTP_STATUS } from '../config/constants.js';

// ====================================
// @desc    Protect routes - Verify JWT token
// @usage   router.use(protect) or router.get('/route', protect, controller)
// ====================================
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.TOKEN_MISSING,
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.ERROR.USER_NOT_FOUND,
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Your account has been deactivated. Please contact admin.',
        });
      }

      // Check if user changed password after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Password was recently changed. Please login again.',
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (err) {
      // Handle specific JWT errors
      if (err.name === 'JsonWebTokenError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid token. Please login again.',
        });
      }

      if (err.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Token expired. Please login again.',
        });
      }

      throw err;
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.ERROR.UNAUTHORIZED,
    });
  }
};

// ====================================
// @desc    Optional auth - Attach user if token exists, continue otherwise
// @usage   For routes that work differently for authenticated users
// ====================================
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token, continue without user
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (err) {
      // Token is invalid, continue without user
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// ====================================
// @desc    Verify token without database lookup (for lightweight checks)
// @usage   For quick token validation
// ====================================
export const verifyTokenOnly = (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.TOKEN_MISSING,
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      req.userRole = decoded.role;
      req.userEmail = decoded.email;
      next();
    } catch (err) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ERROR.INVALID_TOKEN,
      });
    }
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.ERROR.UNAUTHORIZED,
    });
  }
};

export default {
  protect,
  optionalAuth,
  verifyTokenOnly,
};