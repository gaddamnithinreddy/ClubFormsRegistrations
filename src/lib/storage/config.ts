export const STORAGE_CONFIG = {
  BUCKET_NAME: 'forms',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  IMAGE_PATH: 'form-images'
} as const;