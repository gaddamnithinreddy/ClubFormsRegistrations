import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_CONFIG } from './config';
import { validateFile } from './validation';

export async function uploadImage(file: File): Promise<string> {
  try {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${STORAGE_CONFIG.IMAGE_PATH}/${fileName}`;

    // Upload file
    const { error: uploadError, data } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image');
    }

    if (!data?.path) {
      throw new Error('No path returned from upload');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(data.path);

    if (!publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload image');
  }
}