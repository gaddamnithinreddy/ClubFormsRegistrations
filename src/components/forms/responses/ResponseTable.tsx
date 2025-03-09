import React from 'react';
import { FormResponse } from '../../../lib/types';

interface ResponseTableProps {
  responses: FormResponse[];
  fields: any[];
}

export function ResponseTable({ responses, fields }: ResponseTableProps) {
  if (responses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No responses yet
      </div>
    );
  }

  const formatResponse = (response: any, fieldType: string) => {
    if (!response) return '-';
    if (fieldType === 'image') {
      return (
        <a href={response} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          View Image
        </a>
      );
    }
    return response.toString();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Submitted At
            </th>
            {fields.map((field) => (
              <th
                key={field.id}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {responses.map((response, index) => (
            <tr key={response.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(response.submitted_at).toLocaleString()}
              </td>
              {fields.map((field) => (
                <td key={field.id} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
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