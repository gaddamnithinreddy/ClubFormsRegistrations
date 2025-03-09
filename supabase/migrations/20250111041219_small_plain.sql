/*
  # Storage bucket and policies setup
  
  1. Changes
    - Create forms bucket if it doesn't exist
    - Drop existing policies if they exist
    - Recreate policies for public access and authenticated uploads
    - Update bucket public access
  
  2. Notes
    - Safe migration that handles existing policies
    - Maintains consistent storage access rules
*/

-- Create forms bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name)
  VALUES ('forms', 'forms')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public form image access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload form images" ON storage.objects;
END $$;

-- Create policies
CREATE POLICY "Allow public form image access"
ON storage.objects FOR SELECT
USING (bucket_id = 'forms');

CREATE POLICY "Allow authenticated users to upload form images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'forms' AND
  auth.role() = 'authenticated'
);

-- Update bucket public access
UPDATE storage.buckets
SET public = true
WHERE id = 'forms';