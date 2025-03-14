import { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'User already registered':
      return 'This email is already registered. Please sign in instead.';
    case 'Email not confirmed':
      return 'Please check your email to confirm your account.';
    case 'Email rate limit exceeded':
      return 'Too many attempts. Please try again later.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}