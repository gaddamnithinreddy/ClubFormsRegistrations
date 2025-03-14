import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, Instagram, Linkedin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useThemeStore } from '../../lib/store';
import { ThemeToggle } from '../ThemeToggle';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useThemeStore();
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const getHeaderTitle = () => {
    if (location.pathname === '/dashboard') return 'Dashboard';
    if (location.pathname.includes('/forms/new')) return 'Form Builder';
    if (location.pathname.includes('/forms/')) return 'Form Details';
    return '';
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // Add a small delay for the animation to be visible
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate('/auth');
    }, 800);
  };

  // Only show header after role selection and not on auth pages
  if (location.pathname === '/auth' || location.pathname === '/role') {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <motion.button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <Menu className="h-6 w-6" />
            </motion.button>
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-3 text-xl font-bold text-gray-900 dark:text-white"
            >
              {getHeaderTitle()}
            </motion.span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="header-theme-toggle">
              <ThemeToggle />
            </div>
            
            <AnimatePresence mode="wait">
              {isLoggingOut ? (
                <motion.div
                  key="logging-out"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-500 dark:text-red-400 flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <LogOut className="h-5 w-5" />
                  </motion.div>
                  <span className="hidden sm:inline">Logging out...</span>
                </motion.div>
              ) : (
                <div className="relative">
                  <motion.button
                    key="logout-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    aria-label="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </motion.button>
                  
                  {/* Mobile tooltip */}
                  <AnimatePresence>
                    {showTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 bottom-full mb-2 sm:hidden"
                      >
                        <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          Logout
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-16 left-0 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-br-lg z-50"
          >
            <div className="p-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-4 mb-4"
              >
                <img
                  src="https://media.licdn.com/dms/image/v2/D5603AQGzsTUxo31M7A/profile-displayphoto-shrink_800_800/B56ZSiJI5FGsAc-/0/1737887093456?e=1747267200&v=beta&t=7SB-W-0exl-xX5_S1eDnB67nb9BupQJWeSwEq4ElcKg"
                  alt="Gaddam Nithin Reddy"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Gaddam Nithin Reddy</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Frontend & Backend Developer</p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex space-x-4 mt-4"
              >
                <motion.a 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="https://instagram.com/gaddam.nithin_reddy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-700 dark:text-pink-400"
                >
                  <Instagram className="h-6 w-6" />
                </motion.a>
                <motion.a 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="https://www.linkedin.com/in/gaddam-nithin-reddy-81b60a347/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Linkedin className="h-6 w-6" />
                </motion.a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}