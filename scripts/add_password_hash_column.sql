-- Add password_hash column to users table for secure password authentication
-- Run this in Supabase SQL Editor

-- Add password_hash column (nullable for existing users - they'll need to set passwords)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.password_hash IS 'SHA-256 hash of user password for authentication';
