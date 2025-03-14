import { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'User already registered':
      return 'This email is already registered. Please sign in instead.';
    case 'Invalid login credentials':
      return 'Invalid email or password. Please try again.';
    default:
      return error.message;
  }
}