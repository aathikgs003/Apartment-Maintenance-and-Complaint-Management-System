import { HTTP_STATUS, MESSAGES } from '../config/constants.js';

// ====================================
// CUSTOM ERROR CLASS
// ====================================

export class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ====================================
// ERROR HANDLER MIDDLEWARE
// ====================================

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('='.repeat(50));
    console.error('ERROR:', err);
    console.error('='.repeat(50));
  } else {
    console.error('Error:', err.message);
  }

  // Mongoose bad ObjectId error
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value for ${field}: "${value}". Please use another value.`;
    error = new AppError(message, HTTP_STATUS.CONFLICT);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    const message = `Validation failed: ${messages.join('. ')}`;
    error = new AppError(message, HTTP_STATUS.BAD_REQUEST, messages);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please login again.', HTTP_STATUS.UNAUTHORIZED);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please login again.', HTTP_STATUS.UNAUTHORIZED);
  }

  // Multer errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File is too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Unexpected field: ${err.field}`;
        break;
      default:
        message = err.message;
    }
    
    error = new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  // Syntax error in JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Invalid JSON in request body', HTTP_STATUS.BAD_REQUEST);
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError') {
    error = new AppError(
      'Database connection failed. Please try again later.',
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  if (err.name === 'MongoTimeoutError') {
    error = new AppError(
      'Database operation timed out. Please try again.',
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  // Default error response
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || MESSAGES.ERROR.SERVER_ERROR;

  // Build response object
  const response = {
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
  };

  // Add stack trace and error details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.error = err;
  }

  res.status(statusCode).json(response);
};

// ====================================
// NOT FOUND HANDLER
// ====================================

export const notFound = (req, res, next) => {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  const error = new AppError(message, HTTP_STATUS.NOT_FOUND);
  next(error);
};

// ====================================
// ASYNC HANDLER WRAPPER
// ====================================

/**
 * @desc    Wrapper to catch async errors
 * @param   fn - Async function to wrap
 * @usage   router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ====================================
// VALIDATION ERROR HANDLER
// ====================================

/**
 * @desc    Handle express-validator errors
 * @param   validationResult - Result from express-validator
 */
export const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.ERROR.VALIDATION_ERROR,
      errors: errorMessages,
    });
  }

  next();
};

// ====================================
// RATE LIMIT HANDLER
// ====================================

export const rateLimitHandler = (req, res) => {
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// ====================================
// CORS ERROR HANDLER
// ====================================

export const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Cross-origin request blocked',
    });
  }
  next(err);
};

// ====================================
// UNHANDLED REJECTION HANDLER
// ====================================

export const setupUnhandledRejectionHandler = (server) => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('='.repeat(50));
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error('Reason:', reason);
    console.error('='.repeat(50));

    // Close server gracefully
    server.close(() => {
      process.exit(1);
    });
  });
};

// ====================================
// UNCAUGHT EXCEPTION HANDLER
// ====================================

export const setupUncaughtExceptionHandler = () => {
  process.on('uncaughtException', (err) => {
    console.error('='.repeat(50));
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error('Error:', err.name, err.message);
    console.error('Stack:', err.stack);
    console.error('='.repeat(50));

    process.exit(1);
  });
};

// ====================================
// SIGTERM HANDLER
// ====================================

export const setupSigtermHandler = (server) => {
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
    });
  });
};

export default {
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
  handleValidationErrors,
  rateLimitHandler,
  corsErrorHandler,
  setupUnhandledRejectionHandler,
  setupUncaughtExceptionHandler,
  setupSigtermHandler,
};