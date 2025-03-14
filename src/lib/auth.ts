import { supabase } from './supabase';
import { UserRole } from './types';

export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    
    return (data?.role as UserRole) || null;
  } catch (error) {
    console.error('Unexpected error fetching user role:', error);
    return null;
  }
}

export async function setUserRole(userId: string, role: UserRole) {
  try {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ 
        user_id: userId, 
        role 
      }, { 
        onConflict: 'user_id'
      });
      
    if (error) throw error;
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}