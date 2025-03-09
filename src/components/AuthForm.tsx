import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../lib/utils/auth';
import { AuthInput } from './auth/AuthInput';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/role');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            {isLogin ? 'Sign in' : 'Create account'}
          </h2>
        </div>
        
        {error && (
          <div className={`p-3 rounded-md ${
            error.includes('successfully') 
              ? 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/50 text-red-500'
          }`}>
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <AuthInput
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              label="Email"
            />
            <AuthInput
              id="password"
              type="password"
              value={password}
              onChange={setPassword}
              label="Password"
            />
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
              }}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}