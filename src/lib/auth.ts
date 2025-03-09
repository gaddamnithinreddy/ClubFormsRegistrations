import { supabase } from './supabase';
import { UserRole } from './types';
import { AuthError } from '@supabase/supabase-js';

export async function getUserRole(userId: string): Promise<UserRole | null> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user role:', error);
      throw error;
    }
    
    return (data?.role as UserRole) || null;
  } catch (error) {
    console.error('Unexpected error fetching user role:', error);
    throw error;
  }
}

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  console.log('Setting role:', { userId, role }); // Debug log

  if (!userId) {
    throw new Error('User ID is required');
  }

  // Validate role against database constraints
  const validRoles = ['president', 'audience'];
  if (!validRoles.includes(role)) {
    console.error('Invalid role:', { role, validRoles }); // Debug log
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  try {
    // First check if user exists using auth.getUser()
    console.log('Checking user existence...'); // Debug log
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error checking user:', userError); // Debug log
      throw new Error('Failed to verify user');
    }

    console.log('Auth user data:', data); // Debug log

    if (!data.user) {
      console.error('No user found in session'); // Debug log
      throw new Error('User not found');
    }

    // Verify the user ID matches the authenticated user
    if (data.user.id !== userId) {
      console.error('User ID mismatch:', { sessionUserId: data.user.id, requestedUserId: userId }); // Debug log
      throw new Error('Unauthorized: Cannot set role for another user');
    }

    console.log('Setting role in database...'); // Debug log
    // Then set the role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ 
        user_id: userId, 
        role
      }, { 
        onConflict: 'user_id'
      });
      
    if (roleError) {
      console.error('Error setting role:', roleError); // Debug log
      if (roleError.code === '42501') { // Permission denied error
        throw new Error('You do not have permission to set this role');
      } else if (roleError.code === '23503') { // Foreign key violation
        throw new Error('Invalid user account');
      } else {
        throw new Error('Failed to set user role');
      }
    }

    console.log('Role set successfully'); // Debug log
  } catch (error) {
    console.error('Error in setUserRole:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.message) {
        case 'Invalid login credentials':
          throw new Error('Invalid email or password');
        case 'Email not confirmed':
          throw new Error('Please verify your email address');
        default:
          throw error;
      }
    }
    throw error;
  }
}

export async function signUp(email: string, password: string) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.message) {
        case 'User already registered':
          throw new Error('This email is already registered');
        case 'Password is too short':
          throw new Error('Password must be at least 6 characters');
        default:
          throw error;
      }
    }
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}