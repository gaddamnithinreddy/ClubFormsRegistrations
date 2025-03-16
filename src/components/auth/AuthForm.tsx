import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthError } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signUp, getAuthErrorMessage } from '../../lib/api/auth';
import { supabase } from '../../lib/supabase';
import { PasswordInput } from './PasswordInput';
import { validateEmail, validatePassword } from '../../lib/utils/validation';
import { useThemeStore } from '../../lib/store';
import { Sun, Moon, Mail, HelpCircle } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();

  useEffect(() => {
    const clearStaleAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!session) {
          localStorage.removeItem('supabase.auth.token');
        }
      } catch (err) {
        console.warn('Session check warning:', err instanceof Error ? err.message : 'Unknown error');
      }
    };
    
    clearStaleAuth();
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
      if (authError.message.includes('token')) {
        localStorage.removeItem('supabase.auth.token');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 px-4 w-full h-full fixed inset-0 overflow-auto">
      {/* Lottie Animation */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-72 h-72 mb-4 flex items-center justify-center"
      >
        <DotLottieReact
          src="https://lottie.host/906024ab-ad58-4f1b-8d4b-0c5a588071c5/RoHAy0g9qy.lottie"
          loop
          autoplay
          className="w-full h-full"
        />
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl"
      >
        <div>
          <motion.h2 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="text-center text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent"
          >
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </motion.h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? 'Sign in to continue to your account' : 'Sign up to get started'}
          </p>
        </div>
        
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl backdrop-blur-sm ${
                error.includes('successfully') 
                  ? 'bg-green-50/80 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                  : 'bg-red-50/80 dark:bg-red-900/50 text-red-500'
              }`}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-5">
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="pl-10 mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700/80 dark:border-gray-600 dark:text-white transition-all duration-200 hover:border-blue-400"
                />
              </div>
            </div>

            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              label="Password"
              placeholder="Enter your password"
            />

            {!isLogin && (
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                label="Confirm Password"
                placeholder="Confirm your password"
              />
            )}
          </div>

          <div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
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
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </motion.button>
          </div>
        </motion.form>

        <motion.button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isDarkMode ? (
            <Sun className="w-7 h-7 text-yellow-500" />
          ) : (
            <Moon className="w-7 h-7 text-gray-600" />
          )}
        </motion.button>
      </motion.div>
      
      {/* Contact section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-gray-600 dark:text-gray-400 max-w-md w-full"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <HelpCircle className="h-5 w-5 text-blue-500" />
          <h3 className="text-sm font-medium">Need help?</h3>
        </div>
        <p className="text-sm">
          Contact us at{' '}
          <a 
            href="mailto:nithinreddygaddam99@gmail.com" 
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
          >
            nithinreddygaddam99@gmail.com
          </a>
        </p>
      </motion.div>
    </div>
  );
}