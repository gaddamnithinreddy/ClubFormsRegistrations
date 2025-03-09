import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthError } from '@supabase/supabase-js';
import { signIn, signUp, getAuthErrorMessage } from '../../lib/api/auth';
import { supabase } from '../../lib/supabase';
import { validateEmail, validatePassword } from '../../lib/utils/validation';
import { ThemeToggle } from '../ThemeToggle';
import { AuthInput } from './AuthInput';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Clear any stale auth data on component mount
  useEffect(() => {
    const clearStaleAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!session) {
          // Only clear if there's no valid session
          localStorage.removeItem('supabase.auth.token');
        }
      } catch (err) {
        // Only log the error, don't disrupt the user experience
        console.warn('Session check warning:', err instanceof Error ? err.message : 'Unknown error');
      }
    };
    
    clearStaleAuth().catch(err => {
      console.warn('Failed to clear stale auth:', err);
    });
  }, []);

  const validateForm = () => {
    setError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return false;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return false;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/role');
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message === 'User already registered') {
            setIsLogin(true);
          }
          throw error;
        }
        setIsLogin(true);
        setError('Account created successfully! Please sign in.');
      }
    } catch (err) {
      const authError = err as AuthError;
      setError(getAuthErrorMessage(authError));
      // Clear any invalid tokens on auth error
      if (authError.message.includes('token')) {
        localStorage.removeItem('supabase.auth.token');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <AuthInput
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              required
              placeholder="Email address"
              autoComplete="email"
            />
            <AuthInput
              id="password"
              type="password"
              value={password}
              onChange={setPassword}
              required
              placeholder="Password"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            {!isLogin && (
              <AuthInput
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setConfirmPassword('');
              }}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>

        <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Need help? Contact us at{' '}
            <a 
              href="mailto:nithinreddygaddam99@gmail.com"
              className="text-blue-500 hover:text-blue-600 hover:underline font-medium"
            >
              nithinreddygaddam99@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}