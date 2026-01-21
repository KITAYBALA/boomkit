-- FIX RLS POLICIES FOR STAFF
-- This script broadens the update permissions for staff roles to allow moderation actions.

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Staff can update any profile" ON users; -- Just in case I named it differently

-- Create more inclusive policy
CREATE POLICY "Staff can update users"
ON users FOR UPDATE
USING (
    (auth.uid()::text = id) OR 
    (EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND role IN ('owner', 'admin', 'senior_moderator', 'moderator')
    ))
);

-- Also ensure Staff can manage blacklisted IPs
DROP POLICY IF EXISTS "Anyone can read blacklisted_ips" ON blacklisted_ips;
CREATE POLICY "Anyone can read blacklisted_ips"
  ON blacklisted_ips FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff can manage blacklisted IPs" ON blacklisted_ips;
CREATE POLICY "Staff can manage blacklisted IPs"
  ON blacklisted_ips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role IN ('owner', 'admin', 'senior_moderator', 'moderator')
    )
  );

-- Verification
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('users', 'blacklisted_ips');
