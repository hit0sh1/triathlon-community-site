-- Add role field to profiles table for admin management
ALTER TABLE profiles 
ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for role queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- Update RLS policies to allow admins to manage content
CREATE POLICY "Admins can manage all events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to read all profiles for management
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    profiles.id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Update existing policy to allow admins
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile or admins can update any" ON profiles
  FOR UPDATE USING (
    profiles.id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );