import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { FormList } from './forms/FormList';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const clearRole = useAuthStore((state) => state.clearRole);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      clearRole();
      navigate('/role', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    
    // Push a new history state to ensure we can catch the back button
    window.history.pushState({ page: 'dashboard' }, '', window.location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [clearRole, navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Authentication required');
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error('Dashboard auth error:', err);
        setError('Failed to load dashboard');
      }
    };

    checkAuth();
  }, []);

  const handleBack = () => {
    clearRole();
    navigate('/role');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <motion.button
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Role Selection</span>
        </motion.button>
      </div>

      {role === 'president' ? (
        <FormList />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Welcome!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Use the provided form link or scan the QR code to participate in events.
          </p>
        </div>
      )}
    </div>
  );
}