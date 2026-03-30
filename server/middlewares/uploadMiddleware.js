import multer from 'multer';
import path from 'path';
import { FILE_UPLOAD, HTTP_STATUS } from '../config/constants.js';

// ====================================
// MULTER CONFIGURATION
// ====================================

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!FILE_UPLOAD.ALLOWED_FORMATS.includes(file.mimetype)) {
    const error = new Error(
      `Invalid file type. Allowed types: ${FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`
    );
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error(
      `Invalid file extension. Allowed extensions: ${FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`
    );
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error, false);
  }

  cb(null, true);
};

// Base multer configuration
const multerConfig = {
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_FILE_SIZE,
    files: FILE_UPLOAD.MAX_FILES_PER_COMPLAINT,
  },
};

// Create multer instance
const upload = multer(multerConfig);

// ====================================
// MIDDLEWARE FUNCTIONS
// ====================================

/**
 * @desc    Upload single file
 * @param   fieldName - Name of the form field
 * @usage   uploadSingle('profileImage')
 */
export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadHandler = upload.single(fieldName);

    uploadHandler(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      next();
    });
  };
};

/**
 * @desc    Upload multiple files with same field name
 * @param   fieldName - Name of the form field
 * @param   maxCount - Maximum number of files
 * @usage   uploadMultiple('images', 5)
 */
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadHandler = upload.array(fieldName, maxCount);

    uploadHandler(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      next();
    });
  };
};

/**
 * @desc    Upload multiple files with different field names
 * @param   fields - Array of { name: fieldName, maxCount: number }
 * @usage   uploadFields([{ name: 'images', maxCount: 5 }, { name: 'document', maxCount: 1 }])
 */
export const uploadFields = (fields) => {
  return (req, res, next) => {
    const uploadHandler = upload.fields(fields);

    uploadHandler(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      next();
    });
  };
};

/**
 * @desc    Accept any files (use with caution)
 * @usage   uploadAny()
 */
export const uploadAny = () => {
  return (req, res, next) => {
    const uploadHandler = upload.any();

    uploadHandler(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      next();
    });
  };
};

/**
 * @desc    No file upload, but parse multipart form
 * @usage   uploadNone()
 */
export const uploadNone = () => {
  return (req, res, next) => {
    const uploadHandler = upload.none();

    uploadHandler(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      next();
    });
  };
};

// ====================================
// ERROR HANDLER
// ====================================

/**
 * @desc    Handle multer upload errors
 * @param   err - Error object
 * @param   res - Response object
 */
const handleUploadError = (err, res) => {
  console.error('Upload Error:', err);

  // Multer specific errors
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `File too large. Maximum size is ${FILE_UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB`,
          error: err.code,
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Too many files. Maximum is ${FILE_UPLOAD.MAX_FILES_PER_COMPLAINT} files`,
          error: err.code,
        });

      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Unexpected field name: ${err.field}`,
          error: err.code,
        });

      case 'LIMIT_PART_COUNT':
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Too many parts in the request',
          error: err.code,
        });

      case 'LIMIT_FIELD_KEY':
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Field name too long',
          error: err.code,
        });

      case 'LIMIT_FIELD_VALUE':
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Field value too long',
          error: err.code,
        });

      case 'LIMIT_FIELD_COUNT':
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Too many fields',
          error: err.code,
        });

      default:
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'File upload error',
          error: err.code,
        });
    }
  }

  // Custom file filter errors
  if (err.code === 'INVALID_FILE_TYPE' || err.code === 'INVALID_FILE_EXTENSION') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
      error: err.code,
    });
  }

  // Generic error
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Error uploading file',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * @desc    Validate file exists in request
 * @param   fieldName - Name of the file field
 * @param   required - Whether file is required
 */
export const validateFileExists = (fieldName, required = true) => {
  return (req, res, next) => {
    const file = req.file || (req.files && req.files[fieldName]);

    if (required && !file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `${fieldName} is required`,
      });
    }

    next();
  };
};

/**
 * @desc    Validate minimum number of files
 * @param   fieldName - Name of the files field
 * @param   minCount - Minimum number of files required
 */
export const validateMinFiles = (fieldName, minCount) => {
  return (req, res, next) => {
    const files = req.files;

    if (!files || files.length < minCount) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `At least ${minCount} ${fieldName} required`,
      });
    }

    next();
  };
};

/**
 * @desc    Get file info from request
 * @param   req - Request object
 * @returns File information object
 */
export const getFileInfo = (req) => {
  if (req.file) {
    return {
      type: 'single',
      file: {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      },
    };
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      return {
        type: 'array',
        files: req.files.map((f) => ({
          fieldname: f.fieldname,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          buffer: f.buffer,
        })),
      };
    }

    return {
      type: 'fields',
      files: Object.keys(req.files).reduce((acc, key) => {
        acc[key] = req.files[key].map((f) => ({
          fieldname: f.fieldname,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          buffer: f.buffer,
        }));
        return acc;
      }, {}),
    };
  }

  return { type: 'none', files: null };
};

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadAny,
  uploadNone,
  validateFileExists,
  validateMinFiles,
  getFileInfo,
};