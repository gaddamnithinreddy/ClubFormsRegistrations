/*
  # Storage configuration for form images

  1. Changes
    - Create forms bucket if it doesn't exist
    - Set up storage policies for public access and authenticated uploads
    - Handle existing policies gracefully

  2. Security
    - Enable public read access to form images
    - Restrict uploads to authenticated users only
*/

-- Create forms bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('forms', 'forms', true)
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