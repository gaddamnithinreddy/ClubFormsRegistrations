import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

let refreshRetryCount = 0;
const maxRefreshRetries = 3;
const refreshRetryDelay = 1000;

// Add error handling for refresh token failures
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in');
    refreshRetryCount = 0;
  } else if (event === 'USER_UPDATED') {
    console.log('User session updated');
    refreshRetryCount = 0;
  } else if (event === 'SIGNED_OUT') {
    // Clear any stored tokens and reset retry count
    localStorage.removeItem('supabase.auth.token');
    refreshRetryCount = 0;
  }
});

// Handle token refresh errors
supabase.auth.onAuthStateChange((event, session) => {
  if (!session) {
    if (refreshRetryCount < maxRefreshRetries) {
      setTimeout(() => {
        refreshRetryCount++;
        supabase.auth.refreshSession();
      }, refreshRetryDelay * Math.pow(2, refreshRetryCount));
    } else {
      console.error('Max token refresh retries exceeded');
      supabase.auth.signOut();
    }
  }
});