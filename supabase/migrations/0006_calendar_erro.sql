/*
  # Add event date to forms

  1. Changes
    - Add `event_date` column to forms table to store event dates and times
    - Column type is timestamptz to properly handle timezone information
    - Column is nullable since not all forms will have events

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Preserves existing data
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