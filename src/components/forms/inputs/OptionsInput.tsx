import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OptionsInputProps {
  value: string[];
  onChange: (options: string[]) => void;
}

export function OptionsInput({ value, onChange }: OptionsInputProps) {
  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (newOption.trim()) {
      onChange([...value, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="Add new option"
          className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          onKeyPress={(e) => e.key === 'Enter' && addOption()}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={addOption}
          className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {value.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
            >
              <span className="text-sm">{option}</span>
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}