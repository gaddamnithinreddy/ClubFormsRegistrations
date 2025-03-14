/*
  # Add Form Management Policies

  1. Changes
    - Add policies for form management by presidents
    - Allow presidents to create and update their own forms
    - Allow presidents to toggle form status

  2. Security
    - Enable RLS on forms table if not already enabled
    - Add policies for CRUD operations with existence checks
*/

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'forms' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies to ensure clean state
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Presidents can create forms" ON forms;
  DROP POLICY IF EXISTS "Presidents can update their own forms" ON forms;
  DROP POLICY IF EXISTS "Presidents can delete their own forms" ON forms;
  DROP POLICY IF EXISTS "Presidents can read their own forms" ON forms;
END $$;

-- Allow presidents to create forms
CREATE POLICY "Presidents can create forms"
ON forms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'president'
  )
);

-- Allow presidents to update their own forms
CREATE POLICY "Presidents can update their own forms"
ON forms
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'president'
  )
)
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'president'
  )
);

-- Allow presidents to delete their own forms
CREATE POLICY "Presidents can delete their own forms"
ON forms
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'president'
  )
);

-- Allow presidents to read their own forms
CREATE POLICY "Presidents can read their own forms"
ON forms
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'president'
  )
);