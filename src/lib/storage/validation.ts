import { STORAGE_CONFIG } from './config';

export function validateFile(file: File): string | null {
  if (!file) {
    return 'No file selected';
  }

  if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
    return `File size must be less than ${STORAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  if (!STORAGE_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed';
  }

  return null;
}