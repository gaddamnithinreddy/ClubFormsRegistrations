import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Supabase Config:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
});

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