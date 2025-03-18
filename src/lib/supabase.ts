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

// Add detailed auth state tracking
supabase.auth.onAuthStateChange((event, session) => {
  const timestamp = new Date().toISOString();
  
  switch (event) {
    case 'SIGNED_IN':
      console.log(`[${timestamp}] User signed in:`, {
        id: session?.user?.id,
        email: session?.user?.email,
        event: event
      });
      break;
    case 'SIGNED_OUT':
      console.log(`[${timestamp}] User signed out`);
      // Clear any application state if needed
      break;
    case 'TOKEN_REFRESHED':
      console.log(`[${timestamp}] Auth token refreshed`);
      break;
    case 'USER_UPDATED':
      console.log(`[${timestamp}] User profile updated:`, {
        id: session?.user?.id,
        email: session?.user?.email
      });
      break;
    default:
      console.log(`[${timestamp}] Auth event:`, event, session?.user?.email);
  }
});