import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_CONFIG } from './config';
import { validateFile } from './validation';

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
      throw new Error(validationError);
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
      
      console.warn('Storage not available, returning placeholder image');
      return PLACEHOLDER_IMAGE_URL;
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
          return PLACEHOLDER_IMAGE_URL;
        }
      } else if (retryCount < MAX_RETRIES) {
        // Try direct upload as a last resort
        return uploadImage(file, retryCount + 1);
      } else {
        return PLACEHOLDER_IMAGE_URL;
      }
    }
    
    if (!uploadResult.data?.path) {
      console.error('No path returned from upload');
      return PLACEHOLDER_IMAGE_URL;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadResult.data.path);
    
    if (!publicUrl) {
      console.error('Failed to get public URL');
      return PLACEHOLDER_IMAGE_URL;
    }
    
    console.log('Image uploaded successfully:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('Image upload error:', error);
    
    // If we have retries left, try again
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying entire upload process (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      return uploadImage(file, retryCount + 1);
    }
    
    return PLACEHOLDER_IMAGE_URL;
  }
}

// Function to try direct upload to a known bucket without checking bucket list
async function tryDirectUpload(file: File): Promise<string> {
  try {
    // Try with the primary bucket from config first
    const bucketName = STORAGE_CONFIG.BUCKET_NAME;
    
    // Create unique filename
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${uuidv4()}.${fileExt}`;
    const filePath = `${STORAGE_CONFIG.IMAGE_PATH}/${fileName}`;
    
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
          return PLACEHOLDER_IMAGE_URL;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('forms')
          .getPublicUrl(retryData.path);
          
        return publicUrl || PLACEHOLDER_IMAGE_URL;
      }
      
      return PLACEHOLDER_IMAGE_URL;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
      
    return publicUrl || PLACEHOLDER_IMAGE_URL;
  } catch (error) {
    console.error('Direct upload error:', error);
    return PLACEHOLDER_IMAGE_URL;
  }
}