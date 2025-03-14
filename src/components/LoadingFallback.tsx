import React from 'react';
import { Loader } from 'lucide-react';

export function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}