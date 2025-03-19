import React, { useMemo } from 'react';
import { FormResponse } from '../../../lib/types';

interface ResponseTableProps {
  responses: FormResponse[];
  fields: any[];
}

export function ResponseTable({ responses, fields }: ResponseTableProps) {
  // Memoize the stripped HTML function to avoid recalculating on every render
  const stripHtml = useMemo(() => (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  }, []);

  // Memoize the field labels to avoid recalculating on every render
  const fieldLabels = useMemo(() => 
    fields.map(field => ({
      id: field.id,
      label: stripHtml(field.label)
    })), 
    [fields, stripHtml]
  );

  // Memoize the formatResponse function
  const formatResponse = useMemo(() => (response: any, fieldType: string) => {
    if (!response) return '-';
    
    if (fieldType === 'image') {
      return (
        <a href={response} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          View Image
        </a>
      );
    }
    
    if (fieldType === 'multiselect' && Array.isArray(response)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {response.map((item, index) => (
            <li key={index} className="text-sm">
              {typeof item === 'string' ? stripHtml(item) : item}
            </li>
          ))}
        </ul>
      );
    }
    
    if (Array.isArray(response)) {
      return response.map(item => typeof item === 'string' ? stripHtml(item) : item).join(', ');
    }
    
    return typeof response === 'string' ? stripHtml(response) : response.toString();
  }, [stripHtml]);

  if (responses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No responses yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-800">
              Submitted At
            </th>
            {fieldLabels.map(({ id, label }) => (
              <th
                key={id}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {responses.map((response, index) => (
            <tr 
              key={response.id || index} 
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 sticky left-0 bg-white dark:bg-gray-900">
                {new Date(response.submitted_at).toLocaleString()}
              </td>
              {fields.map((field) => (
                <td 
                  key={field.id} 
                  className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800"
                >
                  {formatResponse(response.responses[field.id], field.type)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}