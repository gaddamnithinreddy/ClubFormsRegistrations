import React, { useState } from 'react';
import { X, Check, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '../../../lib/utils/storage';

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<void>;
  uploading?: boolean;
}

export function ImageUploader({ onUpload, uploading = false }: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setError(null);
      await onUpload(file);
    } catch (err) {
      setError('Failed to process image. Please try again.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      try {
        setError(null);
        await onUpload(file);
      } catch (err) {
        setError('Failed to process image. Please try again.');
      }
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 text-red-500 text-xs sm:text-sm">{error}</div>
      )}

      <div 
        className={`border-2 border-dashed rounded-lg p-4 text-center ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center justify-center cursor-pointer">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          ) : (
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
          )}
          
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
            {uploading 
              ? 'Uploading...' 
              : 'Drag & drop an image or click to browse'}
          </span>
          
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Max size: 5MB
          </span>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}