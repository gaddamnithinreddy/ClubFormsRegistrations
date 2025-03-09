import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, FormData } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { FormSuccess } from './FormSuccess';
import { FormFieldEditor } from './editor/FormFieldEditor';
import { FormHeader } from './editor/FormHeader';
import { formatDateForDB } from '../../lib/utils/date';

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

export function FormBuilder() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    eventDate: '',
    eventLocation: '',
    eventEndTime: '',
    fields: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ formId: string; formUrl: string } | null>(null);

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

    // Validate event dates
    if (formData.eventDate && formData.eventEndTime) {
      const startDate = new Date(formData.eventDate);
      const endDate = new Date(formData.eventEndTime);
      if (endDate <= startDate) {
        setError('Event end time must be after event start time');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const formPayload = {
        title: formData.title,
        description: formData.description,
        fields: formData.fields,
        event_date: formData.eventDate ? formatDateForDB(formData.eventDate) : null,
        event_location: formData.eventLocation || null,
        event_end_time: formData.eventEndTime ? formatDateForDB(formData.eventEndTime) : null,
        created_by: user.id,
        accepting_responses: true
      };

      const { data, error: insertError } = await supabase
        .from('forms')
        .insert([formPayload])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          throw new Error('A form with this title already exists');
        }
        throw insertError;
      }
      if (!data) throw new Error('No data returned from insert');

      const baseUrl = window.location.origin;
      setSuccessData({
        formId: data.id,
        formUrl: `${baseUrl}/forms/${data.id}/respond`
      });
    } catch (err) {
      console.error('Error creating form:', err);
      setError(err instanceof Error ? err.message : 'Failed to create form');
      // Reset loading state on error
      setLoading(false);
    }
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

  if (successData) {
    return <FormSuccess formId={successData.formId} formUrl={successData.formUrl} />;
  }

  return (
    <motion.div
      {...pageTransition}
      className="max-w-3xl mx-auto p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <FormHeader
          title={formData.title}
          description={formData.description}
          onTitleChange={(title) => setFormData(prev => ({ ...prev, title }))}
          onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.01 }}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.01 }}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event End Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.eventEndTime}
                onChange={(e) => setFormData(prev => ({ ...prev, eventEndTime: e.target.value }))}
                className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </motion.div>
          </div>

          <motion.div whileHover={{ scale: 1.01 }}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Location (Optional)
            </label>
            <input
              type="text"
              value={formData.eventLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, eventLocation: e.target.value }))}
              placeholder="Enter event location"
              className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </motion.div>
        </div>

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
        </div>

        <motion.button
          type="button"
          onClick={addField}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Field
        </motion.button>

        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Form'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}