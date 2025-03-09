import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Form } from '../../lib/types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { sanitizeHtml } from '../../lib/utils/sanitize';

export function FormList() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Authentication required');

        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setForms(data || []);
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError('Failed to load forms');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Your Forms</h1>
        <Link
          to="/forms/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            You haven't created any forms yet. Click "Create Form" to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((form) => (
            <Link
              key={form.id}
              to={`/forms/${form.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h2 
                className="text-xl font-semibold mb-2 dark:text-white"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.title) }}
              />
              {form.description && (
                <p 
                  className="text-gray-600 dark:text-gray-400 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.description) }}
                />
              )}
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                Created {new Date(form.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}