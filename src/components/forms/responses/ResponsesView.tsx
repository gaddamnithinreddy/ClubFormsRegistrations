import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        
        // First, get the total count
        const { count, error: countError } = await supabase
          .from('form_responses')
          .select('*', { count: 'exact', head: true })
          .eq('form_id', formId);

        if (countError) throw countError;
        setTotalCount(count || 0);

        // Then fetch the paginated data
        const { data, error } = await supabase
          .from('form_responses')
          .select('*')
          .eq('form_id', formId)
          .order('submitted_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

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
  }, [formId, page]);

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      // Fetch all responses for export
      const { data: allResponses, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      const csv = generateCSV(allResponses || [], fields);
      downloadCSV(csv, `form-responses-${formId}.csv`);
    } catch (err) {
      console.error('Failed to export:', err);
      alert('Failed to export responses');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      setLoading(true);
      // Fetch all responses for copying
      const { data: allResponses, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      const csv = generateCSV(allResponses || [], fields);
      await navigator.clipboard.writeText(csv);
      alert('Responses copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy responses');
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 0) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Responses ({totalCount})</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopyToClipboard}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
            disabled={loading}
          >
            <Copy className="w-4 h-4" />
            Copy All
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
            disabled={loading}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <ResponseTable responses={responses} fields={fields} />

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {loading && page > 0 && (
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}