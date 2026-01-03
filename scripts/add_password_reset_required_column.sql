-- Add password_reset_required column to users table
-- Run this in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN users.password_reset_required IS 'Set to true when password needs to be reset (e.g., after admin reset)';

