import React from 'react';
import { FormField } from '../../../lib/types';
import { sanitizeHtml } from '../../../lib/utils/sanitize';

interface FormFieldPreviewProps {
  field: FormField;
}

export function FormFieldPreview({ field }: FormFieldPreviewProps) {
  return (
    <div className="mb-4">
      <div 
        className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(field.label || '') }}
      />
      
      {field.type === 'textarea' ? (
        <textarea
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
          placeholder="Enter your response"
          disabled
          rows={4}
        />
      ) : field.type === 'dropdown' ? (
        <select
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
          disabled
        >
          <option value="">Select an option</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : field.type === 'multiselect' ? (
        <select
          multiple
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
          disabled
          size={Math.min(field.options?.length || 4, 4)}
        >
          {field.options?.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled className="text-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Checkbox option</span>
        </label>
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