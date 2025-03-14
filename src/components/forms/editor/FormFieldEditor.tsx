import React, { useState } from 'react';
import { Trash2, MoveUp, MoveDown, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField } from '../../../lib/types';
import { RichTextEditor } from './RichTextEditor';
import { OptionsInput } from '../inputs/OptionsInput';
import { ExtractedImages } from '../../../lib/utils/imageExtractor';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
import { supabase } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface FormFieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function FormFieldEditor({
  field,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}: FormFieldEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLabelChange = (value: string) => {
    onUpdate({ label: value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as FormField['type'];
    onUpdate({ type: newType });
  };

  const handleRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ required: e.target.checked });
  };

  const handleOptionsChange = (value: string[]) => {
    onUpdate({ options: value });
  };

  // Helper function to determine if we should show extracted images
  const shouldShowExtractedImages = () => {
    if (!field.label) return false;
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizeHtml(field.label || '');
    
    // Check if there are any images in the HTML
    const images = tempDiv.querySelectorAll('img');
    return images.length > 0;
  };

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 space-y-4 border border-gray-200 dark:border-gray-700"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="w-full sm:flex-1">
          <RichTextEditor
            value={field.label || ''}
            onChange={handleLabelChange}
            placeholder="Enter field label"
            enableRichText={true}
            editorId={`field-editor-${field.id}`}
          />
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-md text-xs sm:text-sm flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {shouldShowExtractedImages() && (
            <div className="mt-2">
              <ExtractedImages 
                html={field.label} 
                maxHeight={48}
                containerClassName="mb-2"
                maxImages={3}
                showMoreIndicator={true}
              />
            </div>
          )}
        </div>
        
        <div className="flex gap-1 sm:gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
          <motion.button
            type="button"
            onClick={onMoveUp}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
            aria-label="Move field up"
          >
            <MoveUp size={16} className="sm:w-5 sm:h-5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onMoveDown}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
            aria-label="Move field down"
          >
            <MoveDown size={16} className="sm:w-5 sm:h-5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onDelete}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            aria-label="Delete field"
          >
            <Trash2 size={16} className="sm:w-5 sm:h-5" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Field Type
          </label>
          <select
            value={field.type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            aria-label="Field type"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="email">Email</option>
            <option value="textarea">Text Area</option>
            <option value="select">Single Select</option>
            <option value="multiselect">Multiple Select</option>
            <option value="image">Image Upload</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.required}
            onChange={handleRequiredChange}
            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            aria-label="Required field"
          />
          <label 
            htmlFor={`required-${field.id}`} 
            className="ml-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300"
          >
            Required field
          </label>
        </div>
      </div>

      {(field.type === 'select' || field.type === 'multiselect') && (
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Options (one per line)
          </label>
          <OptionsInput
            value={field.options || []}
            onChange={handleOptionsChange}
          />
        </div>
      )}
    </motion.div>
  );
}