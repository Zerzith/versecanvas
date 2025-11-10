import axios from 'axios';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'ds5t11i5v';
const CLOUDINARY_UPLOAD_PRESET = 'CommissionArt';

const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload image to Cloudinary
 * @param {File} file - The image file to upload
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Upload result with URL and public_id
 */
export const uploadImage = async (file, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  // Add optional parameters
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  if (options.tags) {
    formData.append('tags', options.tags.join(','));
  }

  try {
    const response = await axios.post(CLOUDINARY_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
      width: response.data.width,
      height: response.data.height,
      format: response.data.format
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Delete image from Cloudinary
 * Note: This requires a server-side implementation with your API secret
 * For now, this is a placeholder that would need backend support
 * @param {string} publicId - The public ID of the image to delete
 */
export const deleteImage = async (publicId) => {
  // This would typically be done through your backend API
  console.warn('Delete image requires backend implementation with API secret');
  // Example backend endpoint: POST /api/cloudinary/delete
  // Body: { publicId }
};

/**
 * Generate Cloudinary transformation URL
 * @param {string} publicId - The public ID of the image
 * @param {Object} transformations - Transformation options
 * @returns {string} - Transformed image URL
 */
export const getTransformedImageUrl = (publicId, transformations = {}) => {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = transformations;

  let transformString = `q_${quality},f_${format}`;
  
  if (width || height) {
    transformString += `,c_${crop}`;
    if (width) transformString += `,w_${width}`;
    if (height) transformString += `,h_${height}`;
  }

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/${publicId}`;
};

/**
 * Get optimized thumbnail URL
 * @param {string} url - Original Cloudinary URL
 * @param {number} size - Thumbnail size (default: 300)
 * @returns {string} - Thumbnail URL
 */
export const getThumbnailUrl = (url, size = 300) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Insert transformation parameters into Cloudinary URL
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`);
};

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateImage = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options;

  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  uploadImage,
  deleteImage,
  getTransformedImageUrl,
  getThumbnailUrl,
  validateImage
};

