import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Copy } from 'lucide-react';
import { FormResponse } from '../../../lib/types';
import { supabase } from '../../../lib/supabase';
import { generateCSV, downloadCSV } from '../../../lib/utils/export';
import { ResponseTable } from './ResponseTable';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

interface ResponsesViewProps {
  formId: string;
  fields: any[];
}

export function ResponsesView({ formId, fields }: ResponsesViewProps) {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const { data, error } = await supabase
          .from('form_responses')
          .select('*')
          .eq('form_id', formId)
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        setResponses(data || []);
      } catch (err) {
        console.error('Error fetching responses:', err);
        setError('Failed to load responses');
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [formId]);

  const handleExportCSV = () => {
    const csv = generateCSV(responses, fields);
    downloadCSV(csv, `form-responses-${formId}.csv`);
  };

  const handleCopyToClipboard = async () => {
    try {
      const csv = generateCSV(responses, fields);
      await navigator.clipboard.writeText(csv);
      alert('Responses copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy responses');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Responses ({responses.length})</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopyToClipboard}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy All
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <ResponseTable responses={responses} fields={fields} />
    </div>
  );
}