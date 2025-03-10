import React, { useEffect, Suspense, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingFallback } from './components/LoadingFallback';
import { AuthForm } from './components/auth/AuthForm';
import { RoleSelection } from './components/RoleSelection';
import { Dashboard } from './components/Dashboard';
import { FormBuilder } from './components/forms/FormBuilder';
import { FormView } from './components/forms/FormView';
import { FormResponse } from './components/forms/FormResponse';
import { Header } from './components/layout/Header';
import { NetworkStatus } from './components/shared/NetworkStatus';
import { useAuthStore, useThemeStore } from './lib/store';
import { supabase } from './lib/supabase';
import { SEO } from './components/SEO';

export default function App() {
  const { role, setRole } = useAuthStore();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  // Check Supabase configuration
  useEffect(() => {
    const hasConfig = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (!hasConfig) {
      setIsSupabaseConfigured(false);
      setError('Missing Supabase configuration. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
      return;
    }

    const checkSupabaseConfig = async () => {
      try {
        const { data, error } = await supabase.from('user_roles').select('count');
        if (error) {
          console.error('Supabase connection error:', error);
          setIsSupabaseConfigured(false);
          setError(`Database connection error: ${error.message}. Please check your Supabase configuration.`);
        }
      } catch (err) {
        console.error('Supabase check error:', err);
        setIsSupabaseConfigured(false);
        setError('Failed to connect to the database. Please check your Supabase configuration.');
      }
    };

    checkSupabaseConfig();
  }, []);

  // Memoize route elements to prevent unnecessary re-renders
  const routeElements = useMemo(() => ({
    dashboard: <Dashboard />,
    formBuilder: <FormBuilder />,
    formView: <FormView />,
    formResponse: <FormResponse />,
    auth: <AuthForm />,
    role: <RoleSelection />
  }), []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;

    console.log('App Mount - Starting initialization');

    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          throw new Error('Database is not properly configured');
        }

        // Check if we have a session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session Check Result:', {
          hasSession: !!session,
          userId: session?.user?.id
        });

        if (!session) {
          console.log('No session found - completing initialization');
          if (isMounted) setIsInitializing(false);
          return;
        }

        // If we have a session, fetch the role
        if (session.user && isMounted) {
          console.log('Fetching role for user:', session.user.id);
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          console.log('Role fetch result:', {
            success: !roleError,
            role: roleData?.role,
            error: roleError?.message
          });

          if (roleError && roleError.code !== 'PGRST116') {
            throw roleError;
          }

          if (roleData?.role && isMounted) {
            setRole(roleData.role);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize application');
        }
      } finally {
        console.log('Completing initialization');
        if (isMounted) setIsInitializing(false);
      }
    };

    // Set a shorter timeout for initialization
    initTimeout = setTimeout(() => {
      if (isMounted && isInitializing) {
        console.log('Forcing initialization completion after timeout');
        setIsInitializing(false);
      }
    }, 3000);

    // Start initialization
    initAuth();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', { event, hasSession: !!session });
      
      if (!isMounted) {
        console.log('Ignoring auth change - component unmounted');
        return;
      }

      if (!session) {
        console.log('No session - clearing role');
        setRole(null);
        return;
      }

      // Update role on auth change
      try {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        console.log('Role update result:', {
          success: !roleError,
          role: roleData?.role,
          error: roleError?.message
        });

        if (roleError && roleError.code !== 'PGRST116') {
          throw roleError;
        }

        if (roleData?.role && isMounted) {
          setRole(roleData.role);
        }
      } catch (err) {
        console.error('Role update error:', err);
      }
    });

    return () => {
      console.log('App cleanup');
      isMounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, [setRole, isSupabaseConfigured]);

  // Theme effect with performance optimization
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (!isSupabaseConfigured) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Configuration Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'The application is not properly configured. Please check your environment variables and database connection.'}
            </p>
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Required Environment Variables:
              </p>
              <ul className="text-sm text-left space-y-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                <li className="flex items-center">
                  <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">VITE_SUPABASE_URL</span>
                  <span className="ml-2">- Your Supabase project URL</span>
                </li>
                <li className="flex items-center">
                  <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</span>
                  <span className="ml-2">- Your Supabase anonymous key</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                These can be found in your Supabase project settings under Project Settings > API.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    console.log('App: Rendering loading state...');
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
        <LoadingFallback />
      </div>
    );
  }

  if (error) {
    console.log('App: Rendering error state:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Application Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  console.log('App: Rendering main application...');
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
          <NetworkStatus />
          <BrowserRouter>
            <SEO />
            {role && <Header />}
            <main className="pt-4">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/auth" element={routeElements.auth} />
                  <Route path="/role" element={routeElements.role} />
                  <Route path="/dashboard" element={routeElements.dashboard} />
                  <Route path="/forms/new" element={routeElements.formBuilder} />
                  <Route path="/forms/:id" element={routeElements.formView} />
                  <Route path="/forms/:id/respond" element={routeElements.formResponse} />
                  <Route path="/" element={
                    role ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
          </BrowserRouter>
        </div>
      </ErrorBoundary>
    </HelmetProvider>
  );
}