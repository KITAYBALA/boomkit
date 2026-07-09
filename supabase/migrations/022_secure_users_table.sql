-- Migration: Secure users table
-- Enables RLS and drops any existing permissive policies to prevent data leakage.
-- This ensures that anonymous and authenticated users cannot query the users table directly from the client.
-- All data access to the users table will happen through secure server-side API routes using the Service Role Key.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies if they exist to ensure default-deny behavior
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
