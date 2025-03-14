import React from 'react';
import { Bold, Italic, Underline, Image } from 'lucide-react';
import { motion } from 'framer-motion';

interface EditorToolbarProps {
  styles: string[];
  onStyleToggle: (style: string) => void;
  onImageClick: () => void;
  editorId: string;
}

export function EditorToolbar({ styles, onStyleToggle, onImageClick, editorId }: EditorToolbarProps) {
  return (
    <div className="flex gap-1 p-1 border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent losing focus
          onStyleToggle('bold');
        }}
        className={`p-2 rounded ${styles.includes('bold') ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        data-editor-id={editorId}
      >
        <Bold size={16} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent losing focus
          onStyleToggle('italic');
        }}
        className={`p-2 rounded ${styles.includes('italic') ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        data-editor-id={editorId}
      >
        <Italic size={16} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent losing focus
          onStyleToggle('underline');
        }}
        className={`p-2 rounded ${styles.includes('underline') ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        data-editor-id={editorId}
      >
        <Underline size={16} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent losing focus
          onImageClick();
        }}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        data-editor-id={editorId}
      >
        <Image size={16} />
      </motion.button>
    </div>
  );
}