import { v2 as cloudinary } from 'cloudinary';
import { FILE_UPLOAD, CLOUDINARY_FOLDERS } from '../config/constants.js';
import sharp from 'sharp';

// ====================================
// IMAGE PROCESSING UTILITIES
// ====================================

/**
 * @desc    Resize and optimize image buffer
 * @param   {Buffer} buffer - Image buffer
 * @param   {object} options - Resize options
 * @returns {Promise<Buffer>} - Processed image buffer
 */
export const processImage = async (buffer, options = {}) => {
  const {
    width = 1000,
    height = 1000,
    quality = 80,
    format = 'jpeg',
    fit = 'inside',
  } = options;

  try {
    let sharpInstance = sharp(buffer);

    // Resize image
    sharpInstance = sharpInstance.resize(width, height, {
      fit,
      withoutEnlargement: true,
    });

    // Convert to specified format with quality
    switch (format) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
      default:
        sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
    }

    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * @desc    Create thumbnail from image buffer
 * @param   {Buffer} buffer - Image buffer
 * @param   {number} size - Thumbnail size (width = height)
 * @returns {Promise<Buffer>} - Thumbnail buffer
 */
export const createThumbnail = async (buffer, size = 200) => {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'centre',
      })
      .jpeg({ quality: 70, progressive: true })
      .toBuffer();
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw new Error('Failed to create thumbnail');
  }
};

/**
 * @desc    Get image metadata
 * @param   {Buffer} buffer - Image buffer
 * @returns {Promise<object>} - Image metadata
 */
export const getImageMetadata = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    throw new Error('Failed to get image metadata');
  }
};

// ====================================
// CLOUDINARY UPLOAD FUNCTIONS
// ====================================

/**
 * @desc    Upload image buffer to Cloudinary
 * @param   {Buffer} buffer - Image buffer
 * @param   {object} options - Upload options
 * @returns {Promise<object>} - Upload result
 */
export const uploadToCloudinary = async (buffer, options = {}) => {
  const {
    folder = CLOUDINARY_FOLDERS.COMPLAINTS,
    publicId = null,
    transformation = [],
    tags = [],
    resourceType = 'image',
  } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      tags,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        ...transformation,
      ],
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject({
            success: false,
            error: error.message,
          });
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes,
            resourceType: result.resource_type,
            createdAt: result.created_at,
          });
        }
      }
    );

    // Write buffer to stream
    uploadStream.end(buffer);
  });
};

/**
 * @desc    Upload complaint image
 * @param   {Buffer} buffer - Image buffer
 * @param   {string} complaintId - Complaint ID for folder organization
 * @returns {Promise<object>} - Upload result
 */
export const uploadComplaintImage = async (buffer, complaintId = null) => {
  try {
    // Process image before upload
    const processedBuffer = await processImage(buffer, {
      width: 1200,
      height: 1200,
      quality: 85,
    });

    const folder = complaintId
      ? `${CLOUDINARY_FOLDERS.COMPLAINTS}/${complaintId}`
      : CLOUDINARY_FOLDERS.COMPLAINTS;

    const result = await uploadToCloudinary(processedBuffer, {
      folder,
      tags: ['complaint', 'maintenance'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
      ],
    });

    return result;
  } catch (error) {
    console.error('Error uploading complaint image:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * @desc    Upload proof image (for completed work)
 * @param   {Buffer} buffer - Image buffer
 * @param   {string} complaintId - Complaint ID
 * @returns {Promise<object>} - Upload result
 */
export const uploadProofImage = async (buffer, complaintId = null) => {
  try {
    // Process image before upload
    const processedBuffer = await processImage(buffer, {
      width: 1200,
      height: 1200,
      quality: 85,
    });

    const folder = complaintId
      ? `${CLOUDINARY_FOLDERS.PROOF_IMAGES}/${complaintId}`
      : CLOUDINARY_FOLDERS.PROOF_IMAGES;

    const result = await uploadToCloudinary(processedBuffer, {
      folder,
      tags: ['proof', 'completed-work', 'maintenance'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
      ],
    });

    return result;
  } catch (error) {
    console.error('Error uploading proof image:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * @desc    Upload profile image
 * @param   {Buffer} buffer - Image buffer
 * @param   {string} userId - User ID
 * @returns {Promise<object>} - Upload result
 */
export const uploadProfileImage = async (buffer, userId = null) => {
  try {
    // Create optimized profile image
    const processedBuffer = await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'centre',
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    const options = {
      folder: CLOUDINARY_FOLDERS.PROFILE_IMAGES,
      tags: ['profile', 'avatar'],
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      ],
    };

    if (userId) {
      options.publicId = `profile_${userId}`;
    }

    const result = await uploadToCloudinary(processedBuffer, options);

    return result;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * @desc    Upload multiple images
 * @param   {Array} files - Array of file objects with buffer
 * @param   {object} options - Upload options
 * @returns {Promise<object>} - Upload results
 */
export const uploadMultipleImages = async (files, options = {}) => {
  const {
    folder = CLOUDINARY_FOLDERS.COMPLAINTS,
    maxFiles = FILE_UPLOAD.MAX_FILES_PER_COMPLAINT,
    processOptions = {},
  } = options;

  // Limit number of files
  const filesToUpload = files.slice(0, maxFiles);

  const uploadPromises = filesToUpload.map(async (file) => {
    try {
      // Process image
      const processedBuffer = await processImage(file.buffer, processOptions);

      // Upload to Cloudinary
      return await uploadToCloudinary(processedBuffer, { folder });
    } catch (error) {
      return {
        success: false,
        error: error.message,
        originalName: file.originalname,
      };
    }
  });

  const results = await Promise.all(uploadPromises);

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    success: failed.length === 0,
    uploaded: successful,
    failed,
    totalUploaded: successful.length,
    totalFailed: failed.length,
  };
};

// ====================================
// CLOUDINARY DELETE FUNCTIONS
// ====================================

/**
 * @desc    Delete image from Cloudinary
 * @param   {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} - Delete result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * @desc    Delete multiple images from Cloudinary
 * @param   {string[]} publicIds - Array of public IDs
 * @returns {Promise<object>} - Delete results
 */
export const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    if (!publicIds || publicIds.length === 0) {
      return {
        success: true,
        deleted: {},
        message: 'No images to delete',
      };
    }

    const result = await cloudinary.api.delete_resources(publicIds);

    return {
      success: true,
      deleted: result.deleted,
      partial: result.partial,
    };
  } catch (error) {
    console.error('Cloudinary bulk delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * @desc    Delete folder from Cloudinary
 * @param   {string} folderPath - Folder path to delete
 * @returns {Promise<object>} - Delete result
 */
export const deleteFolderFromCloudinary = async (folderPath) => {
  try {
    // First, delete all resources in the folder
    const { resources } = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderPath,
      max_results: 500,
    });

    if (resources.length > 0) {
      const publicIds = resources.map((r) => r.public_id);
      await deleteMultipleFromCloudinary(publicIds);
    }

    // Then delete the folder
    const result = await cloudinary.api.delete_folder(folderPath);

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('Cloudinary folder delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ====================================
// URL GENERATION UTILITIES
// ====================================

/**
 * @desc    Generate optimized image URL
 * @param   {string} publicId - Cloudinary public ID
 * @param   {object} options - Transformation options
 * @returns {string} - Optimized image URL
 */
export const getOptimizedUrl = (publicId, options = {}) => {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transformation = {
    quality,
    fetch_format: format,
  };

  if (width) transformation.width = width;
  if (height) transformation.height = height;
  if (width || height) transformation.crop = crop;

  return cloudinary.url(publicId, transformation);
};

/**
 * @desc    Generate thumbnail URL
 * @param   {string} publicId - Cloudinary public ID
 * @param   {number} size - Thumbnail size
 * @returns {string} - Thumbnail URL
 */
export const getThumbnailUrl = (publicId, size = 150) => {
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

/**
 * @desc    Generate responsive image URLs
 * @param   {string} publicId - Cloudinary public ID
 * @returns {object} - Object with different size URLs
 */
export const getResponsiveUrls = (publicId) => {
  const sizes = {
    thumbnail: { width: 150, height: 150 },
    small: { width: 320, height: 240 },
    medium: { width: 640, height: 480 },
    large: { width: 1024, height: 768 },
    original: {},
  };

  const urls = {};

  for (const [key, dimensions] of Object.entries(sizes)) {
    if (Object.keys(dimensions).length === 0) {
      urls[key] = cloudinary.url(publicId, {
        quality: 'auto',
        fetch_format: 'auto',
      });
    } else {
      urls[key] = cloudinary.url(publicId, {
        ...dimensions,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      });
    }
  }

  return urls;
};

// ====================================
// VALIDATION UTILITIES
// ====================================

/**
 * @desc    Validate image file
 * @param   {object} file - File object
 * @returns {object} - Validation result
 */
export const validateImage = (file) => {
  const errors = [];

  // Check if file exists
  if (!file) {
    return {
      valid: false,
      errors: ['No file provided'],
    };
  }

  // Check file size
  if (file.size > FILE_UPLOAD.MAX_FILE_SIZE) {
    errors.push(
      `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed (${FILE_UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB)`
    );
  }

  // Check file type
  if (!FILE_UPLOAD.ALLOWED_FORMATS.includes(file.mimetype)) {
    errors.push(
      `File type (${file.mimetype}) not allowed. Allowed types: ${FILE_UPLOAD.ALLOWED_FORMATS.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * @desc    Validate multiple images
 * @param   {Array} files - Array of file objects
 * @returns {object} - Validation result
 */
export const validateMultipleImages = (files) => {
  const errors = [];
  const validFiles = [];
  const invalidFiles = [];

  // Check total count
  if (files.length > FILE_UPLOAD.MAX_FILES_PER_COMPLAINT) {
    errors.push(
      `Too many files (${files.length}). Maximum allowed: ${FILE_UPLOAD.MAX_FILES_PER_COMPLAINT}`
    );
  }

  // Validate each file
  files.forEach((file, index) => {
    const validation = validateImage(file);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({
        index,
        name: file.originalname,
        errors: validation.errors,
      });
    }
  });

  return {
    valid: invalidFiles.length === 0 && errors.length === 0,
    errors,
    validFiles,
    invalidFiles,
  };
};

/**
 * @desc    Check if URL is a Cloudinary URL
 * @param   {string} url - URL to check
 * @returns {boolean} - True if Cloudinary URL
 */
export const isCloudinaryUrl = (url) => {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

/**
 * @desc    Extract public ID from Cloudinary URL
 * @param   {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const extractPublicId = (url) => {
  if (!isCloudinaryUrl(url)) return null;

  try {
    // Remove URL parameters
    const cleanUrl = url.split('?')[0];

    // Extract path after /upload/
    const uploadIndex = cleanUrl.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    let path = cleanUrl.substring(uploadIndex + 8);

    // Remove version if present (v1234567890/)
    if (path.match(/^v\d+\//)) {
      path = path.replace(/^v\d+\//, '');
    }

    // Remove file extension
    const lastDotIndex = path.lastIndexOf('.');
    if (lastDotIndex > -1) {
      path = path.substring(0, lastDotIndex);
    }

    return path;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// ====================================
// EXPORT ALL FUNCTIONS
// ====================================

export default {
  // Image processing
  processImage,
  createThumbnail,
  getImageMetadata,

  // Upload functions
  uploadToCloudinary,
  uploadComplaintImage,
  uploadProofImage,
  uploadProfileImage,
  uploadMultipleImages,

  // Delete functions
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  deleteFolderFromCloudinary,

  // URL utilities
  getOptimizedUrl,
  getThumbnailUrl,
  getResponsiveUrls,

  // Validation
  validateImage,
  validateMultipleImages,
  isCloudinaryUrl,
  extractPublicId,
};