-- Migration: Add game mode and settings to game_sessions
-- Created: 2026-02-01
-- Purpose: Support for 30 unique game modes and custom hosting settings

-- 1. Add the columns (using public schema for maximum compatibility)
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS "mode" TEXT DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}';

-- 2. Force the schema cache to refresh
-- Toggling a comment is a highly reliable trigger for PostgREST cache reload
COMMENT ON TABLE public.game_sessions IS 'Game sessions for Boomkit - Refreshed at migration';

-- 3. Explicitly notify the listen/notify channel if configured
NOTIFY pgrst, 'reload schema';

-- 4. Verification Query (Run this to confirm they are visible)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'game_sessions' 
-- AND column_name IN ('mode', 'settings');
