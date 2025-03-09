import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { Loader, XCircle } from 'lucide-react';
import { SubmissionSuccess } from './SubmissionSuccess';
import { uploadImage } from '../../lib/utils/storage';
import { sanitizeHtml } from '../../lib/utils/sanitize';
import { ThemeToggle } from '../ThemeToggle';

export function FormResponse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [imageUploads, setImageUploads] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        if (!id) throw new Error('Form ID is required');

        const { data: formData, error: formError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .single();

        if (formError) throw formError;
        if (!formData) throw new Error('Form not found');
        
        if (!formData.accepting_responses) {
          throw new Error('This form is currently closed for responses. Please contact the administrator.');
        }
        
        setForm(formData);
      } catch (err) {
        console.error('Error fetching form:', err);
        setError(err instanceof Error ? err.message : 'Form not found');
        setForm(null);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();

    const channel = supabase
      .channel(`form_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forms',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updatedForm = payload.new as Form;
          if (!updatedForm.accepting_responses) {
            setError('This form is currently closed for responses. Please contact the administrator.');
            setForm(null);
          } else {
            setForm(updatedForm);
            setError(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form) {
      setError('Form not found');
      return;
    }

    // Validate required fields
    const missingFields = form.fields
      .filter(field => field.required)
      .filter(field => {
        if (field.type === 'image') {
          return !imageUploads[field.id];
        }
        return !responses[field.id];
      })
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    let tempUser = null;

    try {
      // Check if form is still accepting responses
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('accepting_responses')
        .eq('id', id)
        .single();

      if (formError) throw formError;
      if (!formData?.accepting_responses) {
        throw new Error('This form is currently closed for responses');
      }

      // Create anonymous user
      const anonymousEmail = `anonymous_${Date.now()}@temp.com`;
      const anonymousPassword = `temp_${Math.random().toString(36).slice(2)}`;
      
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: anonymousEmail,
        password: anonymousPassword
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Failed to create temporary user');

      tempUser = user;

      // Handle image uploads with better error handling
      const imageResponses = { ...responses };
      const uploadPromises = Object.entries(imageUploads).map(async ([fieldId, file]) => {
        try {
          const imageUrl = await uploadImage(file);
          imageResponses[fieldId] = imageUrl;
        } catch (error) {
          console.error(`Failed to upload image for field ${fieldId}:`, error);
          throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      await Promise.all(uploadPromises);

      // Submit form response
      const { error: submitError } = await supabase
        .from('form_responses')
        .insert([{
          form_id: id,
          user_id: user.id,
          responses: imageResponses
        }]);

      if (submitError) throw submitError;
      setSubmitted(true);

    } catch (error) {
      console.error('Error submitting response:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit response');
    } finally {
      // Clean up temporary user if it exists
      if (tempUser) {
        try {
          await supabase.auth.signOut();
          // Optionally delete the temporary user
          const { error: deleteError } = await supabase
            .from('auth.users')
            .delete()
            .eq('id', tempUser.id);
          
          if (deleteError) {
            console.error('Failed to delete temporary user:', deleteError);
          }
        } catch (err) {
          console.error('Error cleaning up temporary user:', err);
        }
      }
      setSubmitting(false);
    }
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 dark:text-white">Form Not Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'This form is not accepting responses at the moment. Please contact the administrator.'}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <SubmissionSuccess
        formTitle={form.title}
        formDescription={form.description}
        eventDate={form.event_date ?? undefined}
        eventLocation={form.event_location ?? undefined}
        eventEndTime={form.event_end_time ?? undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-2 dark:text-white" 
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.title) }} />
          {form.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-6"
               dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.description) }} />
          )}
          {form.event_date && (
            <div className="mb-6">
              <p className="text-blue-600 dark:text-blue-400">
                Event Date: {new Date(form.event_date).toLocaleString()}
              </p>
              {form.event_location && (
                <p className="text-blue-600 dark:text-blue-400 mt-1">
                  Venue: {form.event_location}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {form.fields.map((field) => (
              <div key={field.id} className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(field.label) }} />
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'image' ? (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      required={field.required}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Check file size (5MB = 5 * 1024 * 1024 bytes)
                          if (file.size > 5 * 1024 * 1024) {
                            setError('Image size must be less than 5MB');
                            e.target.value = ''; // Clear the input
                            return;
                          }
                          setImageUploads(prev => ({ ...prev, [field.id]: file }));
                          setError(null); // Clear any previous errors
                        }
                      }}
                      className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Maximum file size: 5MB
                    </p>
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    value={responses[field.id] || ''}
                    onChange={(e) => setResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    rows={4}
                  />
                ) : field.type === 'dropdown' ? (
                  <select
                    required={field.required}
                    value={responses[field.id] || ''}
                    onChange={(e) => setResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === 'multiselect' ? (
                  <div className="relative">
                    <div className="w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm focus-within:border-blue-500 focus-within:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors min-h-[120px] p-2">
                      {field.options?.map((option) => (
                        <label key={option} className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                          <input
                            type="checkbox"
                            value={option}
                            checked={Array.isArray(responses[field.id]) && responses[field.id]?.includes(option)}
                            onChange={(e) => {
                              const currentValues = Array.isArray(responses[field.id]) ? responses[field.id] : [];
                              const newValues = e.target.checked
                                ? [...currentValues, option]
                                : currentValues.filter((val: string) => val !== option);
                              setResponses(prev => ({ ...prev, [field.id]: newValues }));
                            }}
                            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{option}</span>
                        </label>
                      ))}
                    </div>
                    {field.required && responses[field.id]?.length === 0 && (
                      <p className="mt-1 text-sm text-red-500">Please select at least one option</p>
                    )}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <div className="space-y-2">
                    {field.options?.map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          checked={Array.isArray(responses[field.id]) && responses[field.id]?.includes(option)}
                          onChange={(e) => {
                            const currentValues = Array.isArray(responses[field.id]) ? responses[field.id] : [];
                            const newValues = e.target.checked
                              ? [...currentValues, option]
                              : currentValues.filter((val: string) => val !== option);
                            setResponses(prev => ({ ...prev, [field.id]: newValues }));
                          }}
                          className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    value={responses[field.id] || ''}
                    onChange={(e) => setResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}