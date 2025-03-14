/*
  # Add accepting_responses column to forms table
  
  1. Changes
    - Add accepting_responses boolean column with default true
    - Update existing records
    - Make column non-nullable
  
  2. Notes
    - Safe migration that checks if column exists first
    - Maintains data consistency by setting defaults
*/

DO $$ 
BEGIN
  -- Add acceptingResponses column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'accepting_responses'
  ) THEN
    ALTER TABLE forms 
    ADD COLUMN accepting_responses boolean DEFAULT true;

    -- Update all existing forms to have accepting_responses set to true
    UPDATE forms SET accepting_responses = true WHERE accepting_responses IS NULL;

    -- Make the column non-nullable after setting defaults
    ALTER TABLE forms 
    ALTER COLUMN accepting_responses SET NOT NULL;
  END IF;
END $$;