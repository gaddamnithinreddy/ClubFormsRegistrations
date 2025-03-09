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
    console.log('App: Starting initialization...');
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;

    const initAuth = async () => {
      try {
        console.log('App: Checking session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('App: Session error:', sessionError);
          throw sessionError;
        }

        console.log('App: Session status:', session ? 'Exists' : 'None');

        if (session?.user && isMounted) {
          console.log('App: Fetching user role...');
          const { data, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (roleError && roleError.code !== 'PGRST116') {
            console.error('App: Role error:', roleError);
            throw roleError;
          }
          
          if (data?.role && isMounted) {
            console.log('App: Setting role:', data.role);
            setRole(data.role);
          }
        }
      } catch (error) {
        console.error('App: Initialization error:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize application');
        }
      } finally {
        if (isMounted) {
          console.log('App: Completing initialization...');
          setIsInitializing(false);
        }
      }
    };

    // Set a timeout to force completion of initialization
    initTimeout = setTimeout(() => {
      if (isMounted && isInitializing) {
        console.log('App: Forcing initialization completion...');
        setIsInitializing(false);
      }
    }, 5000); // Force completion after 5 seconds

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('App: Auth state changed:', event);
      if (!isMounted) return;

      if (!session) {
        console.log('App: Clearing role...');
        setRole(null);
      } else {
        try {
          console.log('App: Fetching updated role...');
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            console.error('App: Role fetch error:', error);
            throw error;
          }
          
          if (data?.role && isMounted) {
            console.log('App: Updating role:', data.role);
            setRole(data.role);
          }
        } catch (error) {
          console.error('App: Role update error:', error);
        }
      }
    });

    return () => {
      console.log('App: Cleaning up...');
      isMounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, [setRole, isInitializing]);

  // Theme effect with performance optimization
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

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