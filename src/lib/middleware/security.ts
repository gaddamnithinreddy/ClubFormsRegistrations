import { supabase } from '../supabase';

export const security = {
  // Sanitize user input to prevent XSS attacks
  sanitizeInput: (input: string): string => {
    return input.replace(/[<>]/g, '');
  },

  // Rate limiting for form submissions
  checkRateLimit: async (userId: string, action: string): Promise<boolean> => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    try {
      const { count } = await supabase
        .from('rate_limits')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('action', action)
        .gte('created_at', fiveMinutesAgo.toISOString());

      return count !== null && count < 100; // Allow 100 actions per 5 minutes
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  },

  // Validate file uploads
  validateFile: (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed');
    }
    
    return true;
  },

  // Validate form data
  validateFormData: (data: any): boolean => {
    if (!data) return false;
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /onload=/gi,
      /onerror=/gi
    ];

    const stringData = JSON.stringify(data);
    return !suspiciousPatterns.some(pattern => pattern.test(stringData));
  },

  // Generate secure random IDs
  generateSecureId: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Validate authentication token
  validateAuthToken: async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  }
}; 