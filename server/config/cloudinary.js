import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
const configureCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true, // Always use HTTPS
    });

    console.log('✅ Cloudinary configured successfully');
    console.log(`☁️ Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);

    return cloudinary;
  } catch (error) {
    console.error('❌ Cloudinary configuration failed:', error.message);
    throw error;
  }
};

// Upload image to Cloudinary
export const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'apartment-maintenance',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' }, // Limit max dimensions
        { quality: 'auto:good' }, // Auto quality optimization
        { fetch_format: 'auto' }, // Auto format selection
      ],
    };

    const uploadOptions = { ...defaultOptions, ...options };
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Upload multiple images
export const uploadMultipleImages = async (filePaths, options = {}) => {
  try {
    const uploadPromises = filePaths.map((filePath) =>
      uploadImage(filePath, options)
    );
    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return {
      success: failed.length === 0,
      uploaded: successful,
      failed: failed,
      totalUploaded: successful.length,
      totalFailed: failed.length,
    };
  } catch (error) {
    console.error('❌ Cloudinary multiple upload error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Upload image from buffer (for multer memory storage)
export const uploadFromBuffer = async (buffer, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'apartment-maintenance',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    };

    const uploadOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary buffer upload error:', error.message);
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
            });
          }
        }
      );

      // Write buffer to stream
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('❌ Cloudinary buffer upload error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete multiple images
export const deleteMultipleImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    
    return {
      success: true,
      deleted: result.deleted,
    };
  } catch (error) {
    console.error('❌ Cloudinary multiple delete error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get image URL with transformations
export const getImageUrl = (publicId, options = {}) => {
  const defaultTransformations = {
    quality: 'auto',
    fetch_format: 'auto',
  };

  const transformations = { ...defaultTransformations, ...options };
  
  return cloudinary.url(publicId, transformations);
};

// Get optimized thumbnail URL
export const getThumbnailUrl = (publicId, width = 200, height = 200) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

// Verify Cloudinary configuration
export const verifyCloudinaryConfig = async () => {
  try {
    const result = await cloudinary.api.ping();
    return {
      success: true,
      status: result.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Export configured cloudinary instance
export { cloudinary };

export default configureCloudinary;