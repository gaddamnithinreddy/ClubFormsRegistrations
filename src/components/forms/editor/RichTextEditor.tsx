import React, { useRef, useEffect, useCallback, useState } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { useRichText } from './useRichText';
import { ImageUploader } from './ImageUploader';
import { X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  enableRichText?: boolean;
  editorId?: string;
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  required,
  multiline = true,
  enableRichText = false,
  editorId = `editor-${Math.random().toString(36).substr(2, 9)}`
}: RichTextEditorProps) {
  const {
    editorRef,
    showImageUpload,
    styles,
    toggleStyle,
    handleImageUpload,
    setShowImageUpload,
    removeImage
  } = useRichText(onChange, editorId);
  
  const [editorImages, setEditorImages] = useState<HTMLImageElement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    if (content !== value) {
      onChange(content);
    }
    
    // Update the list of images in the editor
    if (editorRef.current) {
      setEditorImages(Array.from(editorRef.current.getElementsByTagName('img')));
    }
  }, [onChange, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
    }
  }, [multiline]);

  const handleRemoveImage = (img: HTMLImageElement) => {
    if (removeImage) {
      removeImage(img);
      // Update the list of images after removal
      if (editorRef.current) {
        setEditorImages(Array.from(editorRef.current.getElementsByTagName('img')));
      }
    }
  };

  const handleImageUploadWithStatus = async (file: File) => {
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 5MB.');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      // Convert file to URL using FileReader
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (reader.result && typeof reader.result === 'string') {
          try {
            await handleImageUpload(reader.result);
            
            // Update the list of images after upload
            if (editorRef.current) {
              setEditorImages(Array.from(editorRef.current.getElementsByTagName('img')));
            }
          } catch (err) {
            console.error('Error inserting image:', err);
            setError('Failed to insert image. Please try again.');
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setUploading(false);
      setShowImageUpload(false);
    }
  };

  // Update the editor content when the value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
      // Update the list of images after content update
      setEditorImages(Array.from(editorRef.current.getElementsByTagName('img') || []));
    }
  }, [value]);

  // Initialize the editor images on mount
  useEffect(() => {
    if (editorRef.current) {
      setEditorImages(Array.from(editorRef.current.getElementsByTagName('img') || []));
    }
  }, []);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-md text-xs sm:text-sm flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border rounded-lg dark:border-gray-600 overflow-hidden">
        {enableRichText && (
          <EditorToolbar
            styles={styles}
            onStyleToggle={toggleStyle}
            onImageClick={() => setShowImageUpload(true)}
            editorId={editorId}
          />
        )}
        
        <div
          ref={editorRef}
          id={editorId}
          contentEditable
          className="p-2 sm:p-3 min-h-[100px] focus:outline-none text-sm sm:text-base text-gray-800 dark:text-gray-200 dark:bg-gray-700"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          aria-label={label || "Rich text editor"}
          role="textbox"
          aria-multiline={multiline}
          aria-required={required}
        />
        
        {/* Display images with remove buttons */}
        {editorImages.length > 0 && (
          <div className="p-2 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">Images in content:</p>
            <div className="flex flex-wrap gap-2">
              {editorImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={img.src} 
                    alt={`Content image ${index + 1}`} 
                    className="h-12 sm:h-16 w-auto object-cover rounded border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 sm:p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X size={12} className="sm:w-3 sm:h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showImageUpload && (
        <div className="mt-2 p-3 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Upload Image</h3>
            <button
              type="button"
              onClick={() => setShowImageUpload(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label="Close image uploader"
            >
              <X size={16} />
            </button>
          </div>
          
          <ImageUploader 
            onUpload={handleImageUploadWithStatus} 
            uploading={uploading}
          />
        </div>
      )}
    </div>
  );
}