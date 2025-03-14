import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Form } from '../../lib/types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { sanitizeHtml } from '../../lib/utils/sanitize';
import { ExtractedImages } from '../../lib/utils/imageExtractor';

export default function FormList() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch forms from the database
  const fetchForms = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Set forms directly from the database response
      setForms(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError('Failed to load forms');
      setLoading(false);
    }
  }, [userId]);

  // Get the current user and set up initial data
  useEffect(() => {
    const getUserAndFetchForms = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        setUserId(user.id);
      } catch (err) {
        console.error('Error getting user:', err);
        setError('Failed to authenticate');
        setLoading(false);
      }
    };

    getUserAndFetchForms();
  }, []);

  // Fetch forms whenever userId changes
  useEffect(() => {
    if (userId) {
      fetchForms();
    }
  }, [userId, fetchForms]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;
    
    // Clean up any existing channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`forms-${userId}-${Date.now()}`) // Add timestamp to make channel name unique
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forms',
          filter: `created_by=eq.${userId}`,
        },
        (payload) => {
          // When any change happens, just refetch all forms
          // This ensures we always have the correct, deduplicated list
          fetchForms();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchForms]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Your Forms</h1>
        <Link
          to="/forms/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            You haven't created any forms yet. Click "Create Form" to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 px-4 sm:px-0">
          {forms.map((form) => (
            <Link
              key={form.id}
              to={`/forms/${form.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {form.banner_image && (
                <div className="mb-4 -mt-4 sm:-mt-6 -mx-4 sm:-mx-6">
                  <img
                    src={form.banner_image}
                    alt={form.title}
                    className="w-full h-24 sm:h-32 object-cover rounded-t-lg"
                    onError={(e) => {
                      console.error('Image failed to load:', form.banner_image);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-semibold mb-2 dark:text-white truncate overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.title) }}>
              </h2>
              
              {/* Extract and display images from title */}
              <ExtractedImages 
                html={form.title} 
                maxImages={2}
                maxHeight={16}
                containerClassName="mb-2"
                showMoreIndicator={true}
              />
              
              {form.description && (
                <div 
                  className="text-gray-600 dark:text-gray-400 line-clamp-2 overflow-hidden text-sm sm:text-base"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.description) }}
                />
              )}
              
              {/* Extract and display images from description - limited to 1 image in the card view */}
              <ExtractedImages 
                html={form.description} 
                maxImages={1}
                maxHeight={16}
                containerClassName="mt-2"
                showMoreIndicator={true}
              />
              
              <div className="mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                Created {new Date(form.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}