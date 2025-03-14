import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../lib/utils/auth';
import { AuthInput } from './auth/AuthInput';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, HelpCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            {isLogin ? (
              <LogIn className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            ) : (
              <UserPlus className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <motion.h2 
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-3xl font-bold text-gray-900 dark:text-white"
          >
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </motion.h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? 'Sign in to access your account' : 'Join us by creating a new account'}
          </p>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              error.includes('successfully') 
                ? 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/50 text-red-500 border border-red-200 dark:border-red-800'
            }`}
          >
            {error}
          </motion.div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <AuthInput
                id="email"
                type="email"
                value={email}
                onChange={setEmail}
                label="Email Address"
                icon={true}
                placeholder="Enter your email"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <AuthInput
                id="password"
                type="password"
                value={password}
                onChange={setPassword}
                label="Password"
                icon={true}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                <span>{isLogin ? 'Sign in' : 'Create account'}</span>
              )}
            </motion.button>
          </div>

          <div className="text-center">
            <motion.button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              whileHover={{ scale: 1.05 }}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </motion.button>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <HelpCircle size={16} />
              <span>Need help or contact us:</span>
              <a href="mailto:nithinreddygaddam99@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                nithinreddygaddam99@gmail.com
              </a>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}