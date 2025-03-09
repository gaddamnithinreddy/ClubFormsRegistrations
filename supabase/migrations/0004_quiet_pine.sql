-- Update user_roles policies to be more specific
DROP POLICY IF EXISTS "Users can manage their own roles" ON user_roles;

-- Allow users to insert their own role
CREATE POLICY "Users can insert their own role"
ON user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own role
CREATE POLICY "Users can update their own role"
ON user_roles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own role
CREATE POLICY "Users can read their own role"
ON user_roles
FOR SELECT
USING (auth.uid() = user_id);