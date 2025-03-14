/*
  # Fix user roles RLS policies

  1. Changes
    - Add RLS policies for user_roles table
    - Allow users to manage their own roles
    - Fix existing policies
*/

-- Drop existing RLS policies for user_roles
DROP POLICY IF EXISTS "Users can manage their own roles" ON user_roles;

-- Create new RLS policies
CREATE POLICY "Users can manage their own roles"
ON user_roles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;