import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { NotFound } from './components/NotFound';
import { useAuthStore, useThemeStore } from './lib/store';
import { supabase } from './lib/supabase';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AppRoutes } from './routes';

export default function App() {
  const { role, setRole } = useAuthStore();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  // Initialize auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch and set user role
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role) {
              setRole(data.role);
            }
          });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setRole]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
          <Helmet>
            <title>Form Builder</title>
            <meta name="description" content="Create and manage forms with our easy-to-use form builder" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
            <meta name="theme-color" content={isDarkMode ? '#111827' : '#f9fafb'} />
          </Helmet>
          
          <NetworkStatus />
          <Suspense fallback={<LoadingFallback />}>
            <BrowserRouter>
              {role && <Header />}
              <main className="pt-4">
                <Routes>
                  <Route path="/auth" element={<AuthForm />} />
                  <Route path="/role" element={<RoleSelection />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/forms/new" element={<FormBuilder />} />
                  <Route path="/forms/:id/edit" element={<FormBuilder />} />
                  <Route path="/forms/:id" element={<FormView />} />
                  <Route path="/forms/:id/respond" element={<FormResponse />} />
                  <Route path="/" element={
                    role ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </BrowserRouter>
          </Suspense>
        </div>
      </HelmetProvider>
    </ErrorBoundary>
  );
}