// File validation utilities for secure uploads

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSIONS = { width: 4000, height: 4000 };

export function validateImageFile(file) {
  const errors = [];

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push('Only JPEG, PNG, and WebP images are allowed');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = [
    /\.php$/i,
    /\.js$/i,
    /\.html$/i,
    /\.exe$/i,
    /\.bat$/i,
    /\.sh$/i,
    /script/i,
    /<script/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    errors.push('Invalid file name or type');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const isValid = img.width <= MAX_DIMENSIONS.width && img.height <= MAX_DIMENSIONS.height;
      resolve({
        isValid,
        dimensions: { width: img.width, height: img.height },
        error: isValid ? null : `Image dimensions must be ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height} or smaller`
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Could not read image file'
      });
    };
    
    img.src = url;
  });
}

export async function sanitizeAndValidateImage(file) {
  // Basic file validation
  const basicValidation = validateImageFile(file);
  if (!basicValidation.isValid) {
    return { isValid: false, errors: basicValidation.errors };
  }

  // Dimension validation
  const dimensionValidation = await validateImageDimensions(file);
  if (!dimensionValidation.isValid) {
    return { isValid: false, errors: [dimensionValidation.error] };
  }

  return { isValid: true, errors: [] };
}