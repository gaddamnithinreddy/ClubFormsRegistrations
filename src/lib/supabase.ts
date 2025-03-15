import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create the Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'clubforms-app'
    }
  },
  db: {
    schema: 'public'
  }
});

// Verify storage access on initialization
(async () => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Storage access error:', error.message);
    } else {
      console.log('Available storage buckets:', buckets?.map(b => b.name).join(', ') || 'None');
    }
  } catch (err) {
    console.error('Failed to check storage buckets:', err);
  }
})();

// Add error handling for refresh token failures
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token has been refreshed');
  }
  if (event === 'SIGNED_OUT') {
    // Clear any application state if needed
    console.log('User signed out');
  }
});