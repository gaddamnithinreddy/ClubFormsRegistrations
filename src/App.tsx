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
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user && isMounted) {
          const { data, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (roleError && roleError.code !== 'PGRST116') {
            throw roleError;
          }
          
          if (data?.role && isMounted) {
            setRole(data.role);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize application');
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (!session) {
        setRole(null);
      } else {
        try {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          if (data?.role && isMounted) {
            setRole(data.role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setRole]);

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
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
        <LoadingFallback />
      </div>
    );
  }

  if (error) {
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