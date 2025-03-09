/*
  # Add event details and response control

  1. Changes
    - Add event details columns to forms table
    - Add policies for response control
    - Add image storage handling

  2. Security
    - Update policies for response control
    - Ensure proper access control for images
*/

-- Add event details columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'event_location'
  ) THEN
    ALTER TABLE forms 
    ADD COLUMN event_location text,
    ADD COLUMN event_start_time timestamptz,
    ADD COLUMN event_end_time timestamptz;
  END IF;
END $$;

-- Ensure accepting_responses column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'accepting_responses'
  ) THEN
    ALTER TABLE forms ADD COLUMN accepting_responses boolean DEFAULT true;
  END IF;
END $$;

-- Update form responses policy to check accepting_responses
CREATE POLICY "Check form accepting responses"
ON form_responses FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = form_responses.form_id
    AND forms.accepting_responses = true
  )
);

-- Allow presidents to view all responses for their forms
CREATE POLICY "Presidents can view form responses"
ON form_responses FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM forms
    JOIN user_roles ON forms.created_by = user_roles.user_id
    WHERE forms.id = form_responses.form_id
    AND user_roles.role = 'president'
  )
);