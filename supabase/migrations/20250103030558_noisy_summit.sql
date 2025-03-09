/*
  # Add event date to forms table
  
  1. Changes
    - Add event_date column to forms table for scheduling events
    - Use timestamptz to store dates with timezone information
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'event_date'
  ) THEN
    ALTER TABLE forms ADD COLUMN event_date timestamptz;
  END IF;
END $$;