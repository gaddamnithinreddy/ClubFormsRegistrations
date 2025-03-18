import React, { useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { Helmet } from 'react-helmet-async';

export default function App() {
  const { role, setRole } = useAuthStore();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  // Initialize auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('Active session detected for user:', session.user.email);
        // Fetch and set user role
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role) {
              console.log('User role set to:', data.role);
              setRole(data.role);
            }
          });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email);
        if (session?.user) {
          // Fetch and set user role on sign in
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data?.role) {
                console.log('User role updated to:', data.role);
                setRole(data.role);
              }
            });
        }
      } else if (!session) {
        console.log('No active session, user signed out');
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
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
        <Helmet>
          <title>Club Forms Registration System</title>
          <meta name="description" content="Create, manage, and submit club registration forms easily. A streamlined platform for college club registrations and event management." />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
          <meta name="theme-color" content={isDarkMode ? '#111827' : '#f9fafb'} />
          <meta name="keywords" content="club forms, registration, college events, club registration, form builder" />
          <meta name="author" content="ClubFormsRegistrations" />
          <meta property="og:title" content="Club Forms Registration System" />
          <meta property="og:description" content="Create, manage, and submit club registration forms easily. A streamlined platform for college club registrations." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://clubformsregistrations.vercel.app/" />
          <meta property="og:image" content="https://clubformsregistrations.vercel.app/icons/og-image.png" />
          <link rel="canonical" href="https://clubformsregistrations.vercel.app/" />
        </Helmet>
        
        <NetworkStatus />
        <Suspense fallback={<LoadingFallback />}>
          <HashRouter>
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
          </HashRouter>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}