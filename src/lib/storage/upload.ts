import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_CONFIG } from './config';
import { validateFile } from './validation';

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

// Maximum number of upload retries
const MAX_RETRIES = 2;

// Use only the forms bucket since we know it works
const BUCKET_NAME = 'forms';

export async function uploadImage(file: File, retryCount = 0): Promise<string> {
  try {
    // Validate file first
    const validationError = validateFile(file);
    if (validationError) {
      console.error('File validation error:', validationError);
      throw new ImageUploadError(validationError);
    }

    // Create unique filename with timestamp to avoid collisions
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${uuidv4()}.${fileExt}`;
    const filePath = `${STORAGE_CONFIG.IMAGE_PATH}/${fileName}`;

    console.log(`Attempting upload to ${BUCKET_NAME}/${filePath}`);
    
    // Try to upload the file
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      
      // If we have retries left, try again
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying upload (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return uploadImage(file, retryCount + 1);
      }
      
      throw new ImageUploadError('Failed to upload image after multiple attempts. Please try again.');
    }

    if (!data?.path) {
      throw new ImageUploadError('Upload completed but no file path returned. Please try again.');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    if (!publicUrl) {
      throw new ImageUploadError('Failed to get public URL for uploaded image. Please try again.');
    }

    console.log('Image uploaded successfully:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('Image upload error:', error);
    
    // If we have retries left and it's not already an ImageUploadError, try again
    if (retryCount < MAX_RETRIES && !(error instanceof ImageUploadError)) {
      console.log(`Retrying entire upload process (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return uploadImage(file, retryCount + 1);
    }
    
    if (error instanceof ImageUploadError) {
      throw error;
    }
    
    throw new ImageUploadError('Failed to upload image. Please try again.');
  }
}