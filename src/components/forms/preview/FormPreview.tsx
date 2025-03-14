import React from 'react';
import { FormField } from '../../../lib/types';
import { FormFieldPreview } from './FormFieldPreview';
import { sanitizeHtml } from '../../../lib/utils/sanitize';

interface FormPreviewProps {
  title: string;
  description: string;
  fields: FormField[];
}

export function FormPreview({ title, description, fields }: FormPreviewProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {title && (
        <h2 
          className="text-xl font-bold mb-2 dark:text-white"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} 
        />
      )}
      
      {description && (
        <p 
          className="text-gray-600 dark:text-gray-400 mb-6"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} 
        />
      )}

      <div className="space-y-4">
        {fields.map((field) => (
          <FormFieldPreview key={field.id} field={field} />
        ))}
      </div>
    </div>
  );
}