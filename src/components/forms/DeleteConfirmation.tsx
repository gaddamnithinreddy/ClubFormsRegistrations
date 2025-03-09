import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useThemeStore } from '../../lib/store';
import { motion } from 'framer-motion';

interface DeleteConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmation({ onConfirm, onCancel, isDeleting }: DeleteConfirmationProps) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full ${isDarkMode ? 'dark' : ''}`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete Form</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this form? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}