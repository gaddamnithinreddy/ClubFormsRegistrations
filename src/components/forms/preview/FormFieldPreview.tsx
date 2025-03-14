import React from 'react';
import { FormField } from '../../../lib/types';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
import { ExtractedImages } from '../../../lib/utils/imageExtractor';

interface FormFieldPreviewProps {
  field: FormField;
}

export function FormFieldPreview({ field }: FormFieldPreviewProps) {
  // Only show extracted images if they're not already in the field's image property
  const shouldShowExtractedImages = () => {
    if (!field.label) return false;
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizeHtml(field.label || '');
    
    // Check if there are any images in the HTML
    const images = tempDiv.querySelectorAll('img');
    return images.length > 0;
  };

  return (
    <div className="mb-4">
      <div className="space-y-2">
        <div 
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(field.label || '') }}
        />

        {/* Display images from the field label using the ExtractedImages component */}
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
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
          placeholder="Enter your response"
          disabled
          rows={4}
        />
      ) : field.type === 'select' || field.type === 'multiselect' ? (
        <select
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
          disabled
          multiple={field.type === 'multiselect'}
        >
          <option value="">Select an option</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : field.type === 'image' ? (
        <div className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 flex items-center justify-center">
          <span className="text-gray-500">Image upload field</span>
        </div>
      ) : (
        <input
          type={field.type}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
          placeholder={`Enter ${field.type}`}
          disabled
        />
      )}
    </div>
  );
}