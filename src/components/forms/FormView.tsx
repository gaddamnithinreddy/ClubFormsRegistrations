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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryDelay = 2000;

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const fetchForm = async () => {
      if (!id) {
        setError('Form ID is required');
        setLoading(false);
        return;
      }
      
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
        if (!data) throw new Error('Form not found');

        if (mounted) {
          setForm(data);
          setError(null);
          setRetryCount(0);
        }
      } catch (err) {
        console.error('Error fetching form:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load form');
          if (retryCount < maxRetries) {
            retryTimeout = setTimeout(() => {
              setRetryCount(prev => prev + 1);
              fetchForm();
            }, retryDelay * Math.pow(2, retryCount));
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
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
          if (!mounted) return;
          
          if (payload.eventType === 'UPDATE') {
            const updatedForm = payload.new as Form;
            if (!updatedForm.id) {
              console.error('Invalid form data received');
              return;
            }
            setForm(updatedForm);
            setError(null);
          } else if (payload.eventType === 'DELETE') {
            navigate('/dashboard', { replace: true });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to form changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to form changes');
          if (retryCount < maxRetries) {
            retryTimeout = setTimeout(() => {
              setRetryCount(prev => prev + 1);
              channel.subscribe();
            }, retryDelay * Math.pow(2, retryCount));
          }
        }
      });

    return () => {
      mounted = false;
      clearTimeout(retryTimeout);
      supabase.removeChannel(channel);
    };
  }, [id, navigate, retryCount]);

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
      setError(err instanceof Error ? err.message : 'Failed to update form status');
      // Revert local state on error
      setForm(prev => prev ? { ...prev } : null);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || deleting) return;
    setDeleting(true);
    setError(null);

    try {
      // Delete form responses first
      const { error: responsesError } = await supabase
        .from('form_responses')
        .delete()
        .eq('form_id', id);

      if (responsesError) throw responsesError;

      // Then delete the form
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error deleting form:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete form');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !form) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error || 'Form not found'}
        </div>
      </div>
    );
  }

  const formUrl = `${window.location.origin}/forms/${id}/respond`;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2 dark:text-white" 
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.title) }} />
            {form.description && (
              <p className="text-gray-600 dark:text-gray-400"
                 dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.description) }} />
            )}
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

        <ResponsesView formId={id} fields={form.fields} />
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
  );
}