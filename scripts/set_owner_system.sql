-- Set the user with username "system" to be the owner
-- Run this in Supabase SQL Editor to grant owner privileges

UPDATE users 
SET is_owner = true, role = 'owner'
WHERE username = 'system';

-- Verify the update
SELECT id, username, is_owner, role FROM users WHERE username = 'system';
