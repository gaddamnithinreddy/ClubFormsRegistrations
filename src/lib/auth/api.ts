import { AuthResponse } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  return await supabase.auth.signUp({
    email,
    password,
  });
}