import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

export async function uploadImage(file: File): Promise<string> {
  try {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `form-images/${fileName}`;

    // Upload file to the forms bucket
    const { error: uploadError } = await supabase.storage
      .from('forms')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      if (uploadError.message.includes('duplicate')) {
        // If duplicate error, try with a new filename
        const newFileName = `${uuidv4()}_${Date.now()}.${fileExt}`;
        const newFilePath = `form-images/${newFileName}`;
        const { error: retryError } = await supabase.storage
          .from('forms')
          .upload(newFilePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (retryError) {
          throw new Error('Failed to upload image. Please try again.');
        }
        
        // Get public URL for the retry upload
        const { data: { publicUrl } } = supabase.storage
          .from('forms')
          .getPublicUrl(newFilePath);
        
        return publicUrl;
      }
      throw new Error('Failed to upload image. Please try again.');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('forms')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('Failed to get public URL for the uploaded image');
    }

    return publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload image');
  }
}