-- Migration 020: Add inventory column and active_boosts table

-- 1. Add inventory column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.users.inventory IS 'JSON array representing user inventory booster items';

-- 2. Create active_boosts table
CREATE TABLE IF NOT EXISTS public.active_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activated_by TEXT NOT NULL,
  multiplier NUMERIC NOT NULL,
  duration_hours INTEGER NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS and add policies for active_boosts
ALTER TABLE public.active_boosts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active boosts" ON public.active_boosts;
CREATE POLICY "Anyone can view active boosts" ON public.active_boosts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can activate a boost" ON public.active_boosts;
CREATE POLICY "Authenticated users can activate a boost" ON public.active_boosts FOR INSERT WITH CHECK (true);
