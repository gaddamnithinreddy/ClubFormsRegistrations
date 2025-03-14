/*
  # Add banner image support
  
  1. Changes
    - Add banner_image column to forms table
    - Make it nullable since not all forms will have banners
  
  2. Notes
    - Safe migration that checks if column exists first
    - Maintains data consistency
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'banner_image'
  ) THEN
    ALTER TABLE forms 
    ADD COLUMN banner_image text;
  END IF;
END $$;