import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '../../../lib/utils/storage';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  onClose: () => void;
}

export function ImageUploader({ onUpload, onClose }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const url = await uploadImage(file);
      setUploadedUrl(url);
      setUploadSuccess(true);
    } catch (err) {
      setError('Failed to upload image (MAX 5MB). Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpload = () => {
    if (uploadedUrl) {
      onUpload(uploadedUrl);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Upload Image</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}

        {!uploadSuccess ? (
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-blue-900 dark:file:text-blue-200"
            disabled={loading}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-500">
              <Check size={20} />
              <span>Image uploaded successfully!</span>
            </div>
            {uploadedUrl && (
              <img 
                src={uploadedUrl} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setUploadSuccess(false);
                  setUploadedUrl(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400"
              >
                Upload Another
              </button>
              <button
                onClick={handleConfirmUpload}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Confirm & Insert
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}