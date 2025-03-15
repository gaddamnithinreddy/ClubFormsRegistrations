-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'forms', 'forms', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'forms');

INSERT INTO storage.buckets (id, name, public)
SELECT 'public', 'public', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'public');

-- Enable Row Level Security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the forms bucket
CREATE POLICY "Allow public read access for forms bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'forms' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to upload to forms bucket"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'forms' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

CREATE POLICY "Allow users to update their own uploads in forms bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'forms' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'forms' AND auth.uid() = owner);

CREATE POLICY "Allow users to delete their own uploads in forms bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'forms' AND auth.uid() = owner);

-- Create policies for the public bucket
CREATE POLICY "Allow public read access for public bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

CREATE POLICY "Allow authenticated users to upload to public bucket"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'public' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

CREATE POLICY "Allow users to update their own uploads in public bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'public' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'public' AND auth.uid() = owner);

CREATE POLICY "Allow users to delete their own uploads in public bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'public' AND auth.uid() = owner); 