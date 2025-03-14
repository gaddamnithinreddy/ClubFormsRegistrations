import React, { useState, useEffect } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, FormData } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { FormSuccess } from './FormSuccess';
import { FormFieldEditor } from './editor/FormFieldEditor';
import { FormHeader } from './editor/FormHeader';
import { formatDateForDB } from '../../lib/utils/date';
import { uploadImage } from '../../lib/utils/storage';
import { useThemeStore } from '../../lib/store';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export function FormBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formId, setFormId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    event_date: '',
    event_location: '',
    event_end_time: '',
    banner_image: '',
    fields: []
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ formId: string; formUrl: string } | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { isDarkMode } = useThemeStore();
  const isEditing = Boolean(formId);

  // Load existing form data if editing
  useEffect(() => {
    const loadExistingForm = async () => {
      try {
        setInitialLoading(true);
        
        // Check if we're editing an existing form
        const pathParts = location.pathname.split('/');
        const potentialFormId = pathParts[pathParts.length - 1];
        
        // If we have a valid UUID in the path, try to load that form
        if (potentialFormId && potentialFormId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Authentication required');
          
          const { data, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', potentialFormId)
            .eq('created_by', user.id)
            .single();
            
          if (formError) {
            // If not found or other error, we'll create a new form
            console.log('Creating new form instead:', formError);
          } else if (data) {
            // Found existing form, load it
            setFormId(data.id);
            setFormData({
              title: data.title || '',
              description: data.description || '',
              event_date: data.event_date || '',
              event_location: data.event_location || '',
              event_end_time: data.event_end_time || '',
              banner_image: data.banner_image || '',
              fields: data.fields || []
            });
            setLastSaved(new Date(data.updated_at || data.created_at));
          }
        }
      } catch (err) {
        console.error('Error loading form:', err);
        setError('Failed to load form. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadExistingForm();
  }, [location.pathname]);

  const validateDates = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return true;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return end > start;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please fill in the title');
      return;
    }

    if (formData.fields.length === 0) {
      setError('Please add at least one field');
      return;
    }

    if (formData.event_date && formData.event_end_time) {
      if (!validateDates(formData.event_date, formData.event_end_time)) {
        setError('Event end time must be after event start time');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to create a form');
        setLoading(false);
        return;
      }

      // Generate a new ID if needed
      const currentFormId = formId || uuidv4();
      
      // Prepare the payload with simplified fields
      const formPayload = {
        id: currentFormId,
        title: formData.title,
        description: formData.description || '',
        fields: formData.fields,
        event_date: formData.event_date ? formatDateForDB(formData.event_date) : null,
        event_location: formData.event_location || null,
        event_end_time: formData.event_end_time ? formatDateForDB(formData.event_end_time) : null,
        banner_image: formData.banner_image || null,
        created_by: user.id,
        accepting_responses: true
      };

      console.log('Attempting to save form with ID:', currentFormId);
      
      try {
        // First check if the form already exists
        if (formId) {
          console.log('Updating existing form');
          const { error: updateError } = await supabase
            .from('forms')
            .update(formPayload)
            .eq('id', currentFormId);
            
          if (updateError) {
            console.error('Error updating form:', updateError);
            throw new Error(`Failed to update form: ${updateError.message}`);
          }
        } else {
          console.log('Creating new form');
          const { error: insertError } = await supabase
            .from('forms')
            .insert(formPayload);
            
          if (insertError) {
            console.error('Error creating form:', insertError);
            throw new Error(`Failed to create form: ${insertError.message}`);
          }
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }
      
      try {
        // Get the form data after saving
        const { data: savedForm, error: fetchError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', currentFormId)
          .single();
          
        if (fetchError) {
          console.error('Error fetching saved form:', fetchError);
          throw new Error('Form was saved but could not be retrieved');
        }
        
        if (!savedForm) {
          throw new Error('No data returned after saving form');
        }
        
        console.log('Form saved successfully:', savedForm);
        
        // Update the form ID if this was a new form
        if (!formId) {
          setFormId(savedForm.id);
        }

        const baseUrl = window.location.origin;
        setSuccessData({
          formId: savedForm.id,
          formUrl: `${baseUrl}/forms/${savedForm.id}/respond`
        });
      } catch (fetchError) {
        console.error('Error fetching saved form:', fetchError);
        // Even if we can't fetch the form, it might have been saved successfully
        // So we'll show a success message with the ID we have
        const baseUrl = window.location.origin;
        setSuccessData({
          formId: currentFormId,
          formUrl: `${baseUrl}/forms/${currentFormId}/respond`
        });
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      setError(err instanceof Error ? err.message : 'Failed to save form. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    if (!file) return;
    
    // Clear any previous errors
    setError(null);
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Banner image is too large. Maximum size is 5MB.');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed for the banner.');
      return;
    }

    // Additional image type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }
    
    try {
      setLoading(true);
      const imageUrl = await uploadImage(file);
      if (!imageUrl) {
        throw new Error('Failed to get URL for uploaded banner image');
      }
      setFormData(prev => ({ ...prev, banner_image: imageUrl }));
      setBannerFile(file);
      setError(null);
    } catch (error) {
      console.error('Banner upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload banner image. Please try again.');
      // Reset the banner state on error
      setFormData(prev => ({ ...prev, banner_image: '' }));
      setBannerFile(null);
    } finally {
      setLoading(false);
    }
  };

  const removeBanner = () => {
    setFormData(prev => ({ ...prev, banner_image: '' }));
    setBannerFile(null);
  };

  const addField = () => {
    const newField: FormField = {
      id: uuidv4(),
      type: 'text',
      label: '',
      required: false,
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...formData.fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFormData(prev => ({ ...prev, fields: updatedFields }));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.fields.length) return;

    const updatedFields = [...formData.fields];
    [updatedFields[index], updatedFields[newIndex]] = [updatedFields[newIndex], updatedFields[index]];
    setFormData(prev => ({ ...prev, fields: updatedFields }));
  };

  const deleteField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (successData) {
    return <FormSuccess formId={successData.formId} formUrl={successData.formUrl} />;
  }

  return (
    <>
      <Helmet>
        <title>{isEditing ? `Edit Form: ${formData.title || 'Untitled Form'}` : 'Create New Form'}</title>
        <meta name="description" content="Create and customize your form with our easy-to-use form builder. Add fields, upload images, and share with your audience." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 py-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 mt-8">
          <div className="border-b dark:border-gray-700 pb-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Form' : 'Create New Form'}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                Design your form with custom fields and settings
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm sm:text-base"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Banner Image Upload */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Form Banner</h2>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Banner Image (Optional)
            </label>
            <div className="relative">
              {formData.banner_image ? (
                <div className="relative">
                  <img
                    src={formData.banner_image}
                    alt="Banner preview"
                    className="w-full h-32 sm:h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute top-2 right-2 p-1.5 sm:p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                    aria-label="Remove banner image"
                  >
                    <X size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-32 sm:h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <label className="flex flex-col items-center cursor-pointer">
                    <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                    <span className="mt-2 text-xs sm:text-sm text-gray-500">Click to upload banner</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBannerUpload(file);
                      }}
                      aria-label="Upload banner image"
                    />
                  </label>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Form Details</h2>
            <FormHeader
              title={formData.title}
              description={formData.description}
              onTitleChange={(title) => setFormData(prev => ({ ...prev, title }))}
              onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
            />
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Event Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setFormData(prev => ({ ...prev, event_date: newDate }));
                      if (formData.event_end_time && !validateDates(newDate, formData.event_end_time)) {
                        setDateError('Event end time must be after event start time');
                      } else {
                        setDateError(null);
                      }
                    }}
                    className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    aria-label="Event date and time"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event End Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.event_end_time}
                    onChange={(e) => {
                      const newEndDate = e.target.value;
                      setFormData(prev => ({ ...prev, event_end_time: newEndDate }));
                      if (formData.event_date && !validateDates(formData.event_date, newEndDate)) {
                        setDateError('Event end time must be after event start time');
                      } else {
                        setDateError(null);
                      }
                    }}
                    min={formData.event_date}
                    className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    aria-label="Event end time"
                  />
                </div>
              </div>

              {dateError && (
                <div className="text-red-500 text-sm mt-2">
                  {dateError}
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.event_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_location: e.target.value }))}
                  placeholder="Enter event location"
                  className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  aria-label="Event location"
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Form Fields</h2>
            <div className="space-y-4">
              <AnimatePresence>
                {formData.fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    <FormFieldEditor
                      field={field}
                      onUpdate={(updates) => updateField(index, updates)}
                      onDelete={() => deleteField(index)}
                      onMoveUp={() => moveField(index, 'up')}
                      onMoveDown={() => moveField(index, 'down')}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.button
                type="button"
                onClick={addField}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 sm:p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm"
                aria-label="Add new field"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Add Field
              </motion.button>
            </div>
          </motion.div>

          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
              aria-label={isEditing ? "Save Form" : "Create Form"}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? 'Saving...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Save Form' : 'Create Form'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </>
  );
}