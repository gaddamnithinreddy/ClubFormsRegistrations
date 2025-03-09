import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { getUserRole } from '../lib/auth';

export function PrivateRoute() {
  const location = useLocation();
  const { role, setRole } = useAuthStore();
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          // Only fetch role if not accessing a form response page
          if (!location.pathname.includes('/respond')) {
            const userRole = await getUserRole(session.user.id);
            if (userRole) {
              setRole(userRole);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (!session) {
        setRole(null);
      } else if (!location.pathname.includes('/respond')) {
        const userRole = await getUserRole(session.user.id);
        if (userRole) {
          setRole(userRole);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setRole, location.pathname]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Always require authentication
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // For form responses, only require authentication
  if (location.pathname.includes('/respond')) {
    return <Outlet />;
  }

  // For dashboard and other routes, require role selection
  if (!role) {
    return <Navigate to="/role" state={{ from: location }} replace />;
  }

  // Restrict access to form management pages to presidents only
  if (location.pathname.includes('/forms/') && !location.pathname.includes('/respond')) {
    if (role !== 'president') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}