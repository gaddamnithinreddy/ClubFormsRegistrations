/*
  # Update form access policies

  1. Changes
    - Ensure public access to forms
    - Allow anonymous form responses
    - Update response submission policies
  
  2. Security
    - Enable public read access to forms
    - Allow response submission for open forms only
    - Remove old response policy and create new one
*/

-- First drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public access to forms" ON forms;
DROP POLICY IF EXISTS "Allow anonymous form responses" ON form_responses;
DROP POLICY IF EXISTS "Authenticated users can submit responses" ON form_responses;
DROP POLICY IF EXISTS "Anyone can submit responses to open forms" ON form_responses;

-- Recreate policies with proper checks
CREATE POLICY "Allow public access to forms"
ON forms FOR SELECT
USING (true);

CREATE POLICY "Allow anonymous form responses"
ON form_responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = form_responses.form_id
    AND forms.accepting_responses = true
  )
);

CREATE POLICY "Anyone can submit responses to open forms"
ON form_responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = form_responses.form_id
    AND forms.accepting_responses = true
  )
);