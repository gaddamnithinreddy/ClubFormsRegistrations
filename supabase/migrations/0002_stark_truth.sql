/*
  # Form Management System Schema

  1. Tables
    - `user_roles`: Stores user role information
    - `forms`: Stores form definitions
    - `form_responses`: Stores form submissions
  
  2. Security
    - RLS enabled on all tables
    - Role-based access control
    - Secure form submission handling
*/

DO $$ BEGIN

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('president', 'audience'))
);

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Create form_responses table
CREATE TABLE IF NOT EXISTS form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL,
  user_id uuid NOT NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz DEFAULT now(),
  CONSTRAINT fk_form FOREIGN KEY (form_id) REFERENCES forms(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

END $$;

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Policies for forms
DO $$ BEGIN

CREATE POLICY "Presidents can create forms"
ON forms FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'president'
  )
);

CREATE POLICY "Users can view their own forms"
ON forms FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can submit responses"
ON form_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Form creators can view responses"
ON form_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = form_responses.form_id
    AND forms.created_by = auth.uid()
  )
);

END $$;