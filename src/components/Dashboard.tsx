import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { FormList } from './forms/FormList';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      {role === 'president' ? (
        <FormList />
      ) : (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Welcome!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Use the provided form link or scan the QR code to participate in events.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}