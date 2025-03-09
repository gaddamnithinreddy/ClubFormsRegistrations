import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, UserCog, QrCode, Link as LinkIcon, Loader, CheckCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../lib/store';
import { setUserRole } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { UserRole } from '../lib/types';
import { validateURL } from '../lib/utils/validation';
import { ThemeToggle } from './ThemeToggle';

interface BarcodeDetectorResult {
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
  format: string;
  rawValue: string;
}

interface BarcodeDetector {
  detect(image: HTMLCanvasElement): Promise<BarcodeDetectorResult[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new(options?: { formats: string[] }): BarcodeDetector;
    };
  }
}

const ErrorMessage = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md"
  >
    {message}
  </motion.div>
);

const SuccessMessage = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    exit={{ scale: 0 }}
    className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
  >
    <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-success" />
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mt-2">
      {subtitle}
    </p>
  </motion.div>
);

export function RoleSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRole, role: currentRole } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [showAudienceOptions, setShowAudienceOptions] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Handle browser back button
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      if (showAudienceOptions) {
        setShowAudienceOptions(false);
      } else {
        // If not showing audience options, navigate to auth page
        navigate('/auth', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Push a new history state to ensure we can catch the back button
    window.history.pushState({ page: 'role' }, '', window.location.pathname);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showAudienceOptions, navigate]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [stream]);

  useEffect(() => {
    // Check if user is already authenticated and has a role
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user && currentRole && currentRole !== UserRole.GUEST) {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Session check error:', err);
        // Don't show error to user, just let them select a role
      }
    };

    checkSession();
  }, [currentRole, navigate]);

  const extractFormId = (url: string): string | null => {
    try {
      // Handle full URLs
      if (url.includes('/forms/')) {
        const urlValidation = validateURL(url);
        if (urlValidation) return null;
        return url.split('/forms/')[1]?.split('/')[0] || null;
      }
      // Handle direct form IDs
      if (url.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return url;
      }
      return null;
    } catch {
      return null;
    }
  };

  const validateFormId = async (formId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('id, accepting_responses')
        .eq('id', formId)
        .single();

      if (error) throw error;
      return Boolean(data?.accepting_responses);
    } catch (err) {
      console.error('Form validation error:', err);
      return false;
    }
  };

  const handleRoleSelection = async (role: UserRole) => {
    if (role === UserRole.GUEST) {
      setShowAudienceOptions(true);
      // Push a new history state to handle back button
      window.history.pushState(null, '', location.pathname);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Getting current session...'); // Debug log
      // Get current session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError); // Debug log
        throw sessionError;
      }

      if (!session?.user) {
        console.error('No authenticated user found'); // Debug log
        throw new Error('No authenticated user found');
      }

      const userId = session.user.id;
      console.log('Current user:', { userId, role }); // Debug log

      // Set the role in database
      await setUserRole(userId, role);
      console.log('Role set successfully, updating local state...'); // Debug log

      // Update local state
      setRole(role);
      
      console.log('Navigating to dashboard...'); // Debug log
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Role selection error:', err);
      if (err instanceof Error) {
        // Show more specific error message
        if (err.message.includes('No authenticated user')) {
          setError('Please sign in again to continue');
        } else if (err.message.includes('permission denied')) {
          setError('You do not have permission to set this role');
        } else if (err.message.includes('Invalid role')) {
          setError('Invalid role selected. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred while setting your role');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToForm = async (formId: string, isQRCode: boolean = false) => {
    setError(null);
    try {
      const isValid = await validateFormId(formId);
      if (isValid) {
        setScanSuccess(true);
        setTimeout(() => {
          navigate(`/forms/${formId}/respond`);
        }, 1500);
      } else {
        throw new Error('This form is not available or is not accepting responses');
      }
    } catch (err) {
      console.error('Form navigation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to access form');
      setScanSuccess(false);
      setScanning(false);
    }
  };

  const handleFormUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const formId = extractFormId(formUrl);
    if (!formId) {
      setError('Invalid form URL or ID');
      return;
    }

    await navigateToForm(formId, false);
  };

  const openGoogleLens = () => {
    window.open('https://lens.google.com', '_blank', 'noopener,noreferrer');
  };

  const handleQrCodeScan = async () => {
    try {
      setScanning(true);
      setError(null);

      const constraints = {
        video: { facingMode: 'environment' }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();

        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          const context = canvasRef.current.getContext('2d');

          if (window.BarcodeDetector) {
            const barcodeDetector = new window.BarcodeDetector({
              formats: ['qr_code']
            });

            scanIntervalRef.current = window.setInterval(async () => {
              if (context && videoRef.current && canvasRef.current) {
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                try {
                  const codes = await barcodeDetector.detect(canvasRef.current);
                  if (codes.length > 0) {
                    if (scanIntervalRef.current) {
                      clearInterval(scanIntervalRef.current);
                    }
                    mediaStream.getTracks().forEach(track => track.stop());
                    setStream(null);
                    setScanning(false);

                    const formId = extractFormId(codes[0].rawValue);
                    if (formId) {
                      await navigateToForm(formId);
                    } else {
                      throw new Error('Invalid QR code format');
                    }
                  }
                } catch (error) {
                  console.error('QR Code scanning error:', error);
                  throw error;
                }
              }
            }, 100);
          } else {
            throw new Error('QR code scanning is not supported in this browser');
          }
        }
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setError(error instanceof Error ? error.message : 'Could not access camera. Please use Google Lens or enter the form URL manually.');
      setScanning(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <Loader className="animate-spin text-blue-500" size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-4xl">
        <div className={`w-full transform transition-all duration-500 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <AnimatePresence mode="wait">
            {scanSuccess ? (
              <SuccessMessage 
                title={scanning ? "QR Code Scanned Successfully!" : "Form URL Verified!"}
                subtitle="Redirecting to form..."
              />
            ) : !showAudienceOptions ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-8">
                  Choose Your Role
                </h2>

                <AnimatePresence>
                  {error && <ErrorMessage message={error} />}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
                  <motion.button
                    onClick={() => handleRoleSelection(UserRole.PRESIDENT)}
                    className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <UserCog size={48} className="text-blue-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Club President</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center">
                      Create and manage forms for your events
                    </p>
                  </motion.button>

                  <motion.button
                    onClick={() => handleRoleSelection(UserRole.GUEST)}
                    className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Users size={48} className="text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Audience Member</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center">
                      Participate in events and fill out forms
                    </p>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="audience-options"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl mx-auto"
              >
                <motion.button
                  onClick={() => setShowAudienceOptions(false)}
                  className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  whileHover={{ x: -4 }}
                >
                  ← Back to role selection
                </motion.button>

                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
                  Access Form
                </h2>

                <div className="space-y-6">
                  <motion.div
                    className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    {scanning ? (
                      <div className="space-y-4">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                          <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover"
                            playsInline
                          />
                          <canvas
                            ref={canvasRef}
                            className="hidden"
                          />
                          <div className="absolute inset-0 border-2 border-white/50 rounded-lg" />
                        </div>
                        <p className="text-center text-gray-600 dark:text-gray-400">
                          Position QR code within the frame
                        </p>
                        <button
                          onClick={openGoogleLens}
                          className="w-full mt-2 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink size={16} />
                          Open Google Lens Instead
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <button
                          onClick={handleQrCodeScan}
                          className="w-full flex items-center justify-center gap-3 text-lg font-medium text-blue-600 dark:text-blue-400"
                        >
                          <QrCode size={24} />
                          Scan QR Code
                        </button>
                        <button
                          onClick={openGoogleLens}
                          className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          <ExternalLink size={16} />
                          Use Google Lens Instead
                        </button>
                      </div>
                    )}
                  </motion.div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                    </div>
                  </div>

                  <motion.form
                    onSubmit={handleFormUrlSubmit}
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div>
                      <label htmlFor="form-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter Form URL or ID
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="form-url"
                          value={formUrl}
                          onChange={(e) => setFormUrl(e.target.value)}
                          placeholder="Paste form URL or ID here"
                          className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <motion.button
                          type="submit"
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <LinkIcon size={20} />
                          Go
                        </motion.button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        You can enter either the full form URL or just the form ID
                      </p>
                    </div>
                  </motion.form>
                </div>

                {error && (
                  <AnimatePresence>
                    <ErrorMessage message={error} />
                  </AnimatePresence>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}