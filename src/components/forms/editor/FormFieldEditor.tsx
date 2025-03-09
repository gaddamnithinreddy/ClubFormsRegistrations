import React from 'react';
import { Trash2, MoveUp, MoveDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormField } from '../../../lib/types';
import { RichTextEditor } from './RichTextEditor';
import { OptionsInput } from '../inputs/OptionsInput';

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
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="w-full sm:flex-1">
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Enter field label"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <motion.button
            type="button"
            onClick={onMoveUp}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-500 hover:text-blue-500"
          >
            <MoveUp size={20} />
          </motion.button>
          <motion.button
            type="button"
            onClick={onMoveDown}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-500 hover:text-blue-500"
          >
            <MoveDown size={20} />
          </motion.button>
          <motion.button
            type="button"
            onClick={onDelete}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-500 hover:text-red-500"
          >
            <Trash2 size={20} />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select
          value={field.type}
          onChange={(e) => onUpdate({ type: e.target.value as FormField['type'] })}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="email">Email</option>
          <option value="textarea">Text Area</option>
          <option value="dropdown">Single Select (Dropdown)</option>
          <option value="multiselect">Multiple Select</option>
          <option value="checkbox">Multiple Choice (Checkboxes)</option>
          <option value="image">Image Upload</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="w-4 h-4 text-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Required field</span>
        </label>
      </div>

      {(field.type === 'dropdown' || field.type === 'multiselect' || field.type === 'checkbox') && (
        <OptionsInput
          value={field.options || []}
          onChange={(options) => onUpdate({ options })}
        />
      )}
    </div>
  );
}