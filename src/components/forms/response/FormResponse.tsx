import React, { useState } from 'react';
import { FormField, FormResponse as FormResponseType } from '../../../lib/types';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
import { ExtractedImages } from '../../../lib/utils/imageExtractor';
import { supabase } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface FormResponseFieldProps {
  field: FormField;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

export function FormResponseField({ field, value, onChange }: FormResponseFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    typeof value === 'string' ? value : null
  );

  // Helper function to determine if we should show extracted images
  const shouldShowExtractedImages = () => {
    if (!field.label) return false;
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizeHtml(field.label || '');
    
    // Check if there are any images in the HTML
    const images = tempDiv.querySelectorAll('img');
    return images.length > 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `form-responses/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);
        
      // Update the field with the image URL
      const imageUrl = data.publicUrl;
      setUploadedImage(imageUrl);
      onChange(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="space-y-2">
        <div 
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(field.label || '') }}
        />

        {/* Display images from the field label */}
        {shouldShowExtractedImages() && (
          <ExtractedImages 
            html={field.label} 
            maxHeight={48}
            containerClassName="mb-2"
          />
        )}

        {/* Display the field's attached image if it exists */}
        {field.image && (
          <div className="mb-2">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white dark:bg-gray-800 inline-block">
              <img 
                src={field.image} 
                alt="Field image" 
                className="max-h-48 max-w-full rounded-lg object-contain" 
                onError={(e) => {
                  console.error('Image failed to load:', field.image);
                  e.currentTarget.style.display = 'none';
                }}
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>
      
      {field.type === 'textarea' ? (
        <textarea
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter your response"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      ) : field.type === 'select' ? (
        <select
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select an option</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : field.type === 'multiselect' ? (
        <select
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={value as string[]}
          onChange={(e) => {
            const options = Array.from(e.target.selectedOptions).map(option => option.value);
            onChange(options);
          }}
          multiple
        >
          {field.options?.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : field.type === 'image' ? (
        <div>
          {uploadedImage ? (
            <div className="mb-2">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white dark:bg-gray-800 inline-block">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded image" 
                  className="max-h-48 max-w-full rounded-lg object-contain" 
                  onError={(e) => {
                    console.error('Image failed to load:', uploadedImage);
                    e.currentTarget.style.display = 'none';
                  }}
                  loading="lazy"
                />
              </div>
              <button
                onClick={() => {
                  setUploadedImage(null);
                  onChange('');
                }}
                className="ml-2 text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id={`image-upload-${field.id}`}
                disabled={uploading}
              />
              <label
                htmlFor={`image-upload-${field.id}`}
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </label>
            </div>
          )}
        </div>
      ) : (
        <input
          type={field.type}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder={`Enter ${field.type}`}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
} 