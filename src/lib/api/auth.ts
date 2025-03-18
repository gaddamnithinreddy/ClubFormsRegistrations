import { AuthError, AuthResponse } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    if (response.data?.user) {
      console.log('User signed in successfully:', {
        id: response.data.user.id,
        email: response.data.user.email,
        timestamp: new Date().toISOString()
      });
    }
    
    return response;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    return await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

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