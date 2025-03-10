import { createClient } from '@supabase/supabase-js';

// Default values for development (these will be overridden by environment variables)
const DEFAULT_SUPABASE_URL = 'https://your-project.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'your-anon-key';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

console.log('Supabase Config:', {
  hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  usingDefaults: !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY
});

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are missing. Using default values. Authentication will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'club-forms-auth',
    flowType: 'implicit'
  }
});

// Debug auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth Event:', event);
  console.log('Session:', {
    exists: !!session,
    user: session?.user?.email,
    expires: session?.expires_at
  });
});

// Initial session check
supabase.auth.getSession().then(({ data: { session } }) => {
  console.log('Initial Session Check:', {
    exists: !!session,
    user: session?.user?.email,
    expires: session?.expires_at
  });
});