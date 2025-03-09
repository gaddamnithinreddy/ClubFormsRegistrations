import { FormResponse } from '../types';

export function formatDateForExcel(date: string): string {
  return new Date(date).toLocaleDateString();
}

export function generateCSV(responses: FormResponse[], fields: any[]): string {
  const headers = ['Submitted At', ...fields.map(f => f.label)];
  const rows = responses.map(response => {
    const values = [
      formatDateForExcel(response.submitted_at),
      ...fields.map(field => response.responses[field.id] || '')
    ];
    return values.map(value => `"${value}"`).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}