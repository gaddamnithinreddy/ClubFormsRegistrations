import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ResponsesView } from './responses/ResponsesView';
import { ShareModal } from './sharing/ShareModal';
import { DeleteConfirmation } from './DeleteConfirmation';
import { Share2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { sanitizeHtml } from '../../lib/utils/sanitize';
import { ThemeToggle } from '../ThemeToggle';
import { ExtractedImages } from '../../lib/utils/imageExtractor';

export function FormView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isUserSignedIn, setIsUserSignedIn] = useState(false);
  const [showThemeToggle, setShowThemeToggle] = useState(true);

  // Check if user is already signed in and if there's a theme toggle in the header
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getSession();
      setIsUserSignedIn(!!data.session);
      
      // Check if there's already a theme toggle in the header
      const headerThemeToggle = document.querySelector('.header-theme-toggle');
      setShowThemeToggle(!headerThemeToggle);
    };
    
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Authentication required');
        }

        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setForm(data);
      } catch (err) {
        console.error('Error fetching form:', err);
        setError(err instanceof Error ? err.message : 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();

    // Set up real-time subscription for form status changes
    const channel = supabase
      .channel(`form_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forms',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setForm(payload.new as Form);
          } else if (payload.eventType === 'DELETE') {
            navigate('/dashboard', { replace: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate]);

  const toggleAcceptingResponses = async () => {
    if (!form || updating || !id) return;
    
    setUpdating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const newStatus = !form.accepting_responses;
      
      const { error: updateError } = await supabase
        .from('forms')
        .update({ accepting_responses: newStatus })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state immediately for better UX
      setForm(prev => prev ? { ...prev, accepting_responses: newStatus } : null);
    } catch (err) {
      console.error('Error updating form status:', err);
      setError('Failed to update form status');
      // Revert local state on error
      setForm(prev => prev ? { ...prev } : null);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || deleting) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error deleting form:', err);
      setError('Failed to delete form');
      setDeleting(false);
    }
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-sm w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300">{error || 'Form not found'}</p>
        </div>
      </div>
    );
  }

  const formUrl = `${window.location.origin}/forms/${id}/respond`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showThemeToggle && (
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2 dark:text-white" 
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.title) }} />
              
              {/* Display images from title using ExtractedImages component */}
              <ExtractedImages 
                html={form.title} 
                maxHeight={48}
                containerClassName="mb-3"
                maxImages={3}
                showMoreIndicator={true}
              />
              
              {form.description && (
                <p className="text-gray-600 dark:text-gray-400"
                   dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.description) }} />
              )}
              
              {/* Display images from description using ExtractedImages component */}
              <ExtractedImages 
                html={form.description} 
                maxHeight={48}
                containerClassName="mt-2"
                maxImages={3}
                showMoreIndicator={true}
              />
              
              {form.event_date && (
                <p className="text-blue-600 dark:text-blue-400 mt-2">
                  Event Date: {new Date(form.event_date).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={toggleAcceptingResponses}
                disabled={updating}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors flex-grow sm:flex-grow-0 ${
                  form.accepting_responses
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {form.accepting_responses ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    <span className="whitespace-nowrap">
                      {updating ? 'Updating...' : 'Accepting Responses'}
                    </span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    <span className="whitespace-nowrap">
                      {updating ? 'Updating...' : 'Closed for Responses'}
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 flex-grow sm:flex-grow-0"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 flex items-center gap-2 flex-grow sm:flex-grow-0"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          <ResponsesView formId={id || ''} fields={form.fields} />
        </div>

        {showDeleteConfirm && (
          <DeleteConfirmation
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            isDeleting={deleting}
          />
        )}

        {showShareModal && (
          <ShareModal
            url={formUrl}
            onClose={() => setShowShareModal(false)}
            isAcceptingResponses={form.accepting_responses}
          />
        )}
      </div>
    </div>
  );
}