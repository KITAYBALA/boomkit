-- Utility script to hash a password for a user
-- Usage: Update the username and password values below, then run in Supabase SQL Editor
-- 
-- This uses SHA-256 hashing (matching the Node.js crypto.createHash('sha256') implementation)
-- Note: In production, consider using bcrypt for better security

-- Example: Set password for user "system" to "yourpassword"
-- Replace 'system' and 'yourpassword' with actual values

DO $$
DECLARE
    target_username TEXT := 'system';  -- Change this
    new_password TEXT := 'yourpassword';  -- Change this
    password_hash TEXT;
BEGIN
    -- Hash the password using SHA-256 (PostgreSQL's encode + digest)
    SELECT encode(digest(new_password, 'sha256'), 'hex') INTO password_hash;
    
    -- Update the user's password_hash
    UPDATE users 
    SET password_hash = password_hash
    WHERE username = target_username;
    
    -- Verify
    IF FOUND THEN
        RAISE NOTICE 'Password hash set for user: %', target_username;
        RAISE NOTICE 'Hash: %', password_hash;
    ELSE
        RAISE NOTICE 'User not found: %', target_username;
    END IF;
END $$;

-- Alternative: Direct update (replace values)
-- UPDATE users 
-- SET password_hash = encode(digest('yourpassword', 'sha256'), 'hex')
-- WHERE username = 'system';
