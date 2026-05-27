-- Add pinned_boom column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pinned_boom TEXT;
