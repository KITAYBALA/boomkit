-- Migration 024: Secure User Secrets & Fix Public Frontend Reads
-- Extracts highly sensitive data to a locked-down table so that the main `users` table
-- and public game tables can be safely read by the frontend without leaking secrets.

-- 1. Create user_secrets table
CREATE TABLE IF NOT EXISTS public.user_secrets (
    user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    password_hash TEXT,
    last_ip TEXT,
    mac_address TEXT,
    password_reset_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS on user_secrets (Default Deny - only accessible via Service Role Key)
ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;

-- 3. Migrate data from users to user_secrets
INSERT INTO public.user_secrets (user_id, password_hash, last_ip, mac_address, password_reset_required)
SELECT 
    id, 
    password_hash, 
    last_ip, 
    mac_address, 
    COALESCE(password_reset_required, false)
FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- 4. Drop sensitive columns from users table
ALTER TABLE public.users 
    DROP COLUMN IF EXISTS password_hash,
    DROP COLUMN IF EXISTS last_ip,
    DROP COLUMN IF EXISTS mac_address,
    DROP COLUMN IF EXISTS password_reset_required;

-- 5. Restore Public Read Access to Users Table (Now that secrets are gone)
-- (Users still cannot UPDATE or INSERT without going through secure API routes)
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
CREATE POLICY "Public users are viewable by everyone" ON public.users FOR SELECT USING (true);

-- 6. Restore Public Read Access to Public Game Tables
-- (These were overly restricted by auth.uid() IS NOT NULL which fails on custom JWT frontends)

-- Achievements
DROP POLICY IF EXISTS "Authenticated users can view achievements" ON public.achievements;
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- User Achievements (Leaderboards need to see these)
DROP POLICY IF EXISTS "Authenticated users can view user achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Anyone can view user achievements" ON public.user_achievements;
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements FOR SELECT USING (true);

-- Seasons
DROP POLICY IF EXISTS "Authenticated users can view seasons" ON public.seasons;
DROP POLICY IF EXISTS "Anyone can view seasons" ON public.seasons;
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);

-- Season Rewards
DROP POLICY IF EXISTS "Authenticated users can view rewards" ON public.season_rewards;
DROP POLICY IF EXISTS "Anyone can view rewards" ON public.season_rewards;
CREATE POLICY "Anyone can view rewards" ON public.season_rewards FOR SELECT USING (true);

-- Shop Items
DROP POLICY IF EXISTS "Authenticated users can view shop items" ON public.shop_items;
DROP POLICY IF EXISTS "Anyone can view shop items" ON public.shop_items;
CREATE POLICY "Anyone can view shop items" ON public.shop_items FOR SELECT USING (true);

-- Boom Rentals
DROP POLICY IF EXISTS "Authenticated users can view rentals" ON public.boom_rentals;
DROP POLICY IF EXISTS "Anyone can view rentals" ON public.boom_rentals;
CREATE POLICY "Anyone can view rentals" ON public.boom_rentals FOR SELECT USING (true);

-- Clans
DROP POLICY IF EXISTS "Authenticated users can view clans" ON public.clans;
DROP POLICY IF EXISTS "Anyone can view clans" ON public.clans;
CREATE POLICY "Anyone can view clans" ON public.clans FOR SELECT USING (true);

-- Tournaments
DROP POLICY IF EXISTS "Authenticated users can view tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Anyone can view tournaments" ON public.tournaments;
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);

-- Tournament Participants
DROP POLICY IF EXISTS "Authenticated users can view participants" ON public.tournament_participants;
DROP POLICY IF EXISTS "Anyone can view participants" ON public.tournament_participants;
CREATE POLICY "Anyone can view participants" ON public.tournament_participants FOR SELECT USING (true);

-- Tournament Clans
DROP POLICY IF EXISTS "Authenticated users can view tournament clans" ON public.tournament_clans;
DROP POLICY IF EXISTS "Anyone can view tournament clans" ON public.tournament_clans;
CREATE POLICY "Anyone can view tournament clans" ON public.tournament_clans FOR SELECT USING (true);
