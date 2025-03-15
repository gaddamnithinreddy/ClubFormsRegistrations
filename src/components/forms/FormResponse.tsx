import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { Loader, XCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { SubmissionSuccess } from './SubmissionSuccess';
import { uploadImage } from '../../lib/utils/storage';
import { sanitizeHtml } from '../../lib/utils/sanitize';
import { ThemeToggle } from '../ThemeToggle';
import { ExtractedImages } from '../../lib/utils/imageExtractor';

export function FormResponse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [imageUploads, setImageUploads] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUserSignedIn, setIsUserSignedIn] = useState(false);

  // Check if user is already signed in
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getSession();
      setIsUserSignedIn(!!data.session);
      
      // Check if there's already a theme toggle in the header
      const headerThemeToggle = document.querySelector('.header-theme-toggle');
      setIsUserSignedIn(!!data.session || !!headerThemeToggle);
    };
    
    checkAuthStatus();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const saveTimeout = setTimeout(async () => {
      if (Object.keys(responses).length > 0) {
        setIsSaving(true);
        try {
          const savedResponses = localStorage.getItem(`form_${id}_responses`);
          const currentResponses = {
            responses,
            lastUpdated: new Date().toISOString(),
            formId: id
          };
          localStorage.setItem(`form_${id}_responses`, JSON.stringify(currentResponses));
          setLastSaved(new Date());
        } catch (err) {
          console.error('Error saving responses:', err);
        } finally {
          setIsSaving(false);
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimeout);
  }, [responses, id]);

  // Load saved responses on component mount
  useEffect(() => {
    if (id) {
      try {
        const savedResponses = localStorage.getItem(`form_${id}_responses`);
        if (savedResponses) {
          const parsed = JSON.parse(savedResponses);
          if (parsed.formId === id) {
            setResponses(parsed.responses);
            setLastSaved(new Date(parsed.lastUpdated));
          }
        }
      } catch (err) {
        console.error('Error loading saved responses:', err);
      }
    }
  }, [id]);

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
    setSubmitting(true);
    setError(null);

    // Check for required fields
    const missingRequiredFields = form?.fields
      .filter(field => field.required)
      .filter(field => {
        const value = responses[field.id];
        if (field.type === 'multiselect') {
          return !value || (Array.isArray(value) && value.length === 0);
        }
        if (field.type === 'image') {
          return !imageUploads[field.id];
        }
        return !value;
      });

    if (missingRequiredFields && missingRequiredFields.length > 0) {
      setError(
        <div className="space-y-2">
          <p className="font-medium">Please fill in all required fields:</p>
          <ul className="list-disc list-inside space-y-1">
            {missingRequiredFields.map(field => {
              // Strip HTML tags from field label
              const plainLabel = field.label.replace(/<[^>]*>/g, '');
              return (
                <li key={field.id} className="text-red-600 dark:text-red-400">
                  {plainLabel}
                </li>
              );
            })}
          </ul>
        </div>
      );
      setSubmitting(false);
      return;
    }

    try {
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('accepting_responses')
        .eq('id', id)
        .single();

      if (formError) throw formError;
      if (!formData?.accepting_responses) {
        throw new Error('This form is currently closed for responses');
      }

      // Clean responses by removing HTML tags from any string values
      const cleanedResponses = { ...responses };
      Object.keys(cleanedResponses).forEach(key => {
        if (typeof cleanedResponses[key] === 'string') {
          cleanedResponses[key] = cleanedResponses[key].replace(/<[^>]*>/g, '');
        } else if (Array.isArray(cleanedResponses[key])) {
          cleanedResponses[key] = cleanedResponses[key].map((item: any) => 
            typeof item === 'string' ? item.replace(/<[^>]*>/g, '') : item
          );
        }
      });

      // Process image uploads first
      const imageResponses = { ...cleanedResponses };
      let failedUploads: { fieldId: string; error: string }[] = [];
      
      // Only attempt image uploads if there are images to upload
      if (Object.keys(imageUploads).length > 0) {
        try {
          // Upload all images in parallel for better performance
          const uploadPromises = Object.entries(imageUploads).map(async ([fieldId, file]) => {
            try {
              const imageUrl = await uploadImage(file);
              return { fieldId, imageUrl, success: true };
            } catch (error) {
              console.error(`Error uploading image for field ${fieldId}:`, error);
              failedUploads.push({ 
                fieldId, 
                error: error instanceof Error ? error.message : 'Upload failed'
              });
              return { fieldId, success: false, error };
            }
          });

          const uploadResults = await Promise.all(uploadPromises);
          
          // Update responses with image URLs for successful uploads only
          uploadResults.forEach(result => {
            if (result.success && 'imageUrl' in result) {
              imageResponses[result.fieldId] = result.imageUrl;
            }
          });
          
          // If any uploads failed, show error and stop form submission
          if (failedUploads.length > 0) {
            setError(
              <div className="space-y-2">
                <p className="font-medium">Image upload failed for the following fields:</p>
                <ul className="list-disc list-inside space-y-1">
                  {failedUploads.map(({ fieldId, error }) => {
                    const field = form?.fields.find(f => f.id === fieldId);
                    const fieldLabel = field?.label.replace(/<[^>]*>/g, '') || fieldId;
                    return (
                      <li key={fieldId} className="text-red-600 dark:text-red-400">
                        {fieldLabel}: {error}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-sm">Please try uploading the images again.</p>
              </div>
            );
            setSubmitting(false);
            return;
          }
        } catch (uploadError) {
          console.error('Error during image uploads:', uploadError);
          setError('Failed to upload images. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      let userId;
      
      // Check if user is already signed in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Use existing user ID if signed in
        userId = session.user.id;
      } else {
        // Create anonymous user if not signed in
        const anonymousEmail = `anonymous_${Date.now()}@temp.com`;
        const anonymousPassword = `temp_${Math.random().toString(36).slice(2)}`;
        
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email: anonymousEmail,
          password: anonymousPassword
        });

        if (signUpError) throw signUpError;
        if (!user) throw new Error('Failed to create temporary user');
        
        userId = user.id;
      }

      const { error: submitError } = await supabase
        .from('form_responses')
        .insert([
          {
            form_id: id,
            user_id: userId,
            responses: imageResponses,
            submitted_at: new Date().toISOString(),
          },
        ]);

      if (submitError) throw submitError;
      
      setSubmitted(true);
      
      // Clear saved form data after successful submission
      localStorage.removeItem(`form_${id}_responses`);

      // Only sign out if we created a temporary user
      if (!session?.user) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageFieldUpload = async (fieldId: string, file: File) => {
    try {
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        setError(
          <div className="space-y-2">
            <p className="font-medium">File too large:</p>
            <p>The image "{file.name}" exceeds the maximum size of 5MB. Please select a smaller image.</p>
          </div>
        );
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError(
          <div className="space-y-2">
            <p className="font-medium">Invalid file type:</p>
            <p>Only JPEG, PNG, GIF, and WebP images are allowed.</p>
          </div>
        );
        return;
      }
      
      // Store the file in the imageUploads state
      setImageUploads(prev => ({ ...prev, [fieldId]: file }));
      
      // Also set the file name in responses to show it's been selected
      setResponses(prev => ({ ...prev, [fieldId]: file.name }));
      
      // Clear any previous error
      if (error) setError(null);
    } catch (err) {
      console.error('Error handling image upload:', err);
      setError('Failed to process image. Please try again.');
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
        eventDate={form.event_date}
        eventLocation={form.event_location}
        eventEndTime={form.event_end_time}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6">
      {/* Only show theme toggle if user is not already signed in (to avoid duplicates) */}
      {!isUserSignedIn && (
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
        >
          {form.banner_image && (
            <div className="w-full h-48">
              <img
                src={form.banner_image}
                alt={form.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2 dark:text-white" 
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.title) }} />
            
            <ExtractedImages 
              html={form.title} 
              maxHeight={48}
              containerClassName="mb-4"
            />
            
            {form.description && (
              <div 
                className="text-gray-600 dark:text-gray-400 mb-6"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.description) }}
              />
            )}
            
            <ExtractedImages 
              html={form.description} 
              maxHeight={48}
              containerClassName="mb-6"
            />
            
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

            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader className="animate-spin" size={16} />
                    Saving...
                  </span>
                ) : lastSaved ? (
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                ) : null}
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="animate-fade-in"
                >
                  <div className="space-y-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="text-base font-semibold text-gray-900 dark:text-white"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(field.label) }}
                      />
                      {field.required && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                    </div>
                    
                    <ExtractedImages 
                      html={field.label} 
                      maxHeight={48}
                      containerClassName="mt-2"
                    />
                    
                    {field.image && (
                      <div className="mt-2">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white dark:bg-gray-800 inline-block">
                          <img 
                            src={field.image} 
                            alt="Field image" 
                            className="max-h-48 max-w-full rounded-lg object-contain" 
                            onError={(e) => {
                              console.error('Image failed to load:', field.image);
                              e.currentTarget.style.display = 'none';
                            }}
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {field.type === 'multiselect' ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        (You can select multiple options)
                      </div>
                      <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                        {field.options?.map((option) => (
                          <label key={option} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(responses[field.id] || []).includes(option)}
                              onChange={(e) => {
                                const currentValues = responses[field.id] || [];
                                const newValues = e.target.checked
                                  ? [...currentValues, option]
                                  : currentValues.filter((value: string) => value !== option);
                                setResponses({ ...responses, [field.id]: newValues });
                              }}
                              className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : field.type === 'select' ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <select
                        required={field.required}
                        value={responses[field.id] || ''}
                        onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white p-2"
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : field.type === 'textarea' ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <textarea
                        required={field.required}
                        value={responses[field.id] || ''}
                        onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white p-3"
                        rows={4}
                        placeholder="Enter your response here..."
                      />
                    </div>
                  ) : field.type === 'image' ? (
                    <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <label className="flex flex-col items-center px-2 sm:px-4 py-6 bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-400 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="w-full px-2 text-center">
                          <p className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                            {imageUploads[field.id] 
                              ? imageUploads[field.id].name.length > 25 
                                ? imageUploads[field.id].name.substring(0, 25) + '...' 
                                : imageUploads[field.id].name
                              : 'Click to upload an image (max 5MB)'}
                          </p>
                          {imageUploads[field.id] && imageUploads[field.id].name.length > 25 && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {imageUploads[field.id].name}
                            </p>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          required={field.required}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageFieldUpload(field.id, file);
                            }
                          }}
                        />
                      </label>
                      {imageUploads[field.id] && (
                        <div className="relative inline-block mt-3">
                          <img
                            src={URL.createObjectURL(imageUploads[field.id])}
                            alt="Preview"
                            className="h-32 w-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newUploads = { ...imageUploads };
                              delete newUploads[field.id];
                              setImageUploads(newUploads);
                              setResponses(prev => {
                                const newResponses = { ...prev };
                                delete newResponses[field.id];
                                return newResponses;
                              });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <input
                        type={field.type}
                        required={field.required}
                        value={responses[field.id] || ''}
                        onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white p-3"
                        placeholder={`Enter ${field.type === 'email' ? 'your email' : field.type === 'number' ? 'a number' : 'your response'}`}
                      />
                    </div>
                  )}
                </motion.div>
              ))}

              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}