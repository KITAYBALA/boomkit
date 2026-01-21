-- FINALIZE SECURITY HARDENING
-- All user updates now go through the secure /api/users/update route.
-- We can now disable direct client-side updates to prevent cheating and unbanning attempts.

-- 1. Remove direct update permissions from the 'users' table
DROP POLICY IF EXISTS "Staff can update users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- 2. Remove direct blacklist management (now handled by server)
DROP POLICY IF EXISTS "Staff can manage blacklisted IPs" ON blacklisted_ips;

-- 3. Ensure SELECT access remains (game needs to read user list)
-- (Keep current SELECT policies as they are necessary for the UI)

-- Verification
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('users', 'blacklisted_ips');
