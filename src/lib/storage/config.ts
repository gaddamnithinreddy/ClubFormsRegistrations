export const STORAGE_CONFIG = {
  // Primary bucket name, with fallbacks in the upload function
  BUCKET_NAME: 'forms' as 'forms' | 'public',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  IMAGE_PATH: 'form-images'
} as const;