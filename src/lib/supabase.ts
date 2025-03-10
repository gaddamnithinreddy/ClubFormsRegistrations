import { createClient } from '@supabase/supabase-js';

// Check for environment variables
const hasSupabaseConfig = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

console.log('Supabase Config:', {
  hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  isConfigured: hasSupabaseConfig
});

// Only create the client if we have proper configuration
export const supabase = hasSupabaseConfig
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: localStorage,
          storageKey: 'club-forms-auth',
          flowType: 'implicit'
        }
      }
    )
  : {
      // Stub implementation when not configured
      auth: {
        onAuthStateChange: (callback: any) => ({
          data: { subscription: { unsubscribe: () => {} } }
        }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.reject(new Error('Supabase is not configured')),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.reject(new Error('Supabase is not configured'))
          }),
          count: () => Promise.reject(new Error('Supabase is not configured'))
        })
      })
    };

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