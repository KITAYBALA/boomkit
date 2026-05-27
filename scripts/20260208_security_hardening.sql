-- Security Hardening Schema Updates (2026-02-08)

-- 1. Add new columns to users for application system
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, approved, rejected
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reason TEXT; -- Using reason to match registration route

-- 2. Backfill existing users and Validate status values
UPDATE public.users SET status = 'approved' WHERE status IS NULL OR status NOT IN ('pending', 'approved', 'rejected');

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE public.users ADD CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'));

-- 3. Create Blacklisted IPs table
CREATE TABLE IF NOT EXISTS public.blacklisted_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip TEXT UNIQUE NOT NULL,
    reason TEXT,
    banned_by TEXT,
    banned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on Blacklist
ALTER TABLE public.blacklisted_ips ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Blacklist
-- Staff can view blacklist
DROP POLICY IF EXISTS "Staff can view blacklist" ON public.blacklisted_ips;
CREATE POLICY "Staff can view blacklist" ON public.blacklisted_ips
    FOR SELECT
    USING (
        exists (
            select 1 from public.users
            where users.id = auth.uid()::text
            and users.role IN ('owner', 'admin', 'senior_moderator', 'moderator')
        )
    );

-- Staff can insert into blacklist
DROP POLICY IF EXISTS "Staff can insert blacklist" ON public.blacklisted_ips;
CREATE POLICY "Staff can insert blacklist" ON public.blacklisted_ips
    FOR INSERT
    WITH CHECK (
        exists (
            select 1 from public.users
            where users.id = auth.uid()::text
            and users.role IN ('owner', 'admin', 'senior_moderator', 'moderator')
        )
    );

-- Owner/Admin can delete from blacklist
DROP POLICY IF EXISTS "Admins can delete blacklist" ON public.blacklisted_ips;
CREATE POLICY "Admins can delete blacklist" ON public.blacklisted_ips
    FOR DELETE
    USING (
        exists (
            select 1 from public.users
            where users.id = auth.uid()::text
            and users.role IN ('owner', 'admin')
        )
    );

-- 6. Update handle_new_user to include default status
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    'pending' -- Default status is now pending
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 7. Secure RPC for Middleware to check IP
CREATE OR REPLACE FUNCTION public.is_ip_blacklisted(check_ip TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.blacklisted_ips WHERE ip = check_ip);
END;
$$;
GRANT EXECUTE ON FUNCTION public.is_ip_blacklisted(TEXT) TO anon, authenticated, service_role;
