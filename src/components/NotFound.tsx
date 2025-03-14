import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

export function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found | Form Builder</title>
        <meta name="description" content="The page you're looking for doesn't exist or has been moved." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="text-9xl font-bold text-gray-200 dark:text-gray-700">404</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Page Not Found</h1>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Home size={18} />
                <span>Go Home</span>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft size={18} />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
} 