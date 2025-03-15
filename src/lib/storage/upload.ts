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

// Placeholder URL for when image upload fails
const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/600x400?text=Image+Upload+Failed';

// Maximum number of upload retries
const MAX_RETRIES = 2;

export async function uploadImage(file: File, retryCount = 0): Promise<string> {
  try {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      console.error('File validation error:', validationError);
      throw new ImageUploadError(validationError);
    }

    // Check if storage is available by listing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError.message);
      
      // Check if this is a permissions error
      if (bucketsError.message.includes('permission') || bucketsError.message.includes('not authorized')) {
        console.warn('Permission denied for bucket access. Trying direct upload to known bucket.');
        return tryDirectUpload(file);
      }
      
      throw new ImageUploadError('Storage service unavailable. Please try again later.');
    }
    
    // Log all available buckets for debugging
    console.log('Available buckets:', buckets?.map(b => b.name).join(', ') || 'None');
    
    // If no buckets exist at all, try direct upload to known bucket
    if (!buckets || buckets.length === 0) {
      console.warn('No storage buckets found in list, trying direct upload');
      return tryDirectUpload(file);
    }
    
    // Check if our configured buckets exist
    const publicBucketExists = buckets.some(bucket => bucket.name === 'public');
    const formsBucketExists = buckets.some(bucket => bucket.name === 'forms');
    
    // Use the bucket that exists, with preference for 'forms'
    let bucketName = formsBucketExists ? 'forms' : (publicBucketExists ? 'public' : STORAGE_CONFIG.BUCKET_NAME);
    
    console.log(`Selected bucket for upload: ${bucketName}`);
    
    // Create unique filename with timestamp to avoid collisions
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${uuidv4()}.${fileExt}`;
    const filePath = `${STORAGE_CONFIG.IMAGE_PATH}/${fileName}`;
    
    console.log(`Attempting to upload to ${bucketName}/${filePath}`);
    
    // Try to upload the file
    let uploadResult = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadResult.error) {
      console.error('Upload error:', uploadResult.error.message);
      
      // If this is a bucket not found error and we have retries left, try with a different bucket
      if ((uploadResult.error.message.includes('bucket') || uploadResult.error.message.includes('not found')) && retryCount < MAX_RETRIES) {
        console.log(`Retrying upload with different bucket (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        // Try the other bucket
        const alternateBucket = bucketName === 'forms' ? 'public' : 'forms';
        bucketName = alternateBucket;
        
        uploadResult = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadResult.error) {
          console.error('Retry upload error:', uploadResult.error.message);
          throw new ImageUploadError('Failed to upload image after retrying. Please try again.');
        }
      } else if (retryCount < MAX_RETRIES) {
        // Try direct upload as a last resort
        return uploadImage(file, retryCount + 1);
      } else {
        throw new ImageUploadError('Failed to upload image after multiple attempts. Please try again.');
      }
    }
    
    if (!uploadResult.data?.path) {
      throw new ImageUploadError('Upload completed but no file path returned. Please try again.');
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadResult.data.path);
    
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
      return uploadImage(file, retryCount + 1);
    }
    
    // If it's already an ImageUploadError, rethrow it
    if (error instanceof ImageUploadError) {
      throw error;
    }
    
    // Otherwise, wrap it in an ImageUploadError
    throw new ImageUploadError('Failed to upload image. Please try again.');
  }
}

// Function to try direct upload to a known bucket without checking bucket list
async function tryDirectUpload(file: File): Promise<string> {
  try {
    // Create unique filename
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${uuidv4()}.${fileExt}`;
    const filePath = `${STORAGE_CONFIG.IMAGE_PATH}/${fileName}`;
    
    // Try with the primary bucket from config first
    const bucketName = STORAGE_CONFIG.BUCKET_NAME;
    console.log(`Attempting direct upload to ${bucketName}/${filePath}`);
    
    const { error: uploadError, data } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Direct upload error:', uploadError.message);
      
      // Try with 'forms' bucket if the primary bucket is 'public'
      if (bucketName === 'public') {
        console.log('Trying direct upload to forms bucket');
        const { error: retryError, data: retryData } = await supabase.storage
          .from('forms')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (retryError) {
          console.error('Forms bucket upload error:', retryError.message);
          throw new ImageUploadError('Failed to upload to both buckets. Please try again.');
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('forms')
          .getPublicUrl(retryData.path);
          
        if (!publicUrl) {
          throw new ImageUploadError('Failed to get public URL for uploaded image. Please try again.');
        }
        
        return publicUrl;
      }
      
      throw new ImageUploadError('Failed to upload image. Please try again.');
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
      
    if (!publicUrl) {
      throw new ImageUploadError('Failed to get public URL for uploaded image. Please try again.');
    }
    
    return publicUrl;
  } catch (error) {
    console.error('Direct upload error:', error);
    if (error instanceof ImageUploadError) {
      throw error;
    }
    throw new ImageUploadError('Failed to upload image. Please try again.');
  }
}