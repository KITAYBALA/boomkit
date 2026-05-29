-- Migration: 017_clan_upgrades_and_realtime.sql
-- Description: Sets up postgres realtime for clan messages, upgrades schema, fixes compare_rarity, and implements clan-based tournaments.

-- 1. Enable Realtime Replication for Clan Chat Messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'clan_chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_chat_messages;
    END IF;
END;
$$;

-- 2. Add Upgrade Columns to Clans Table
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS member_limit INTEGER DEFAULT 15;
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS xp_multiplier NUMERIC DEFAULT 1.0;
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS unlocked_colors TEXT[] DEFAULT ARRAY['text-purple-400', 'text-blue-400', 'text-green-400', 'text-yellow-400'];

-- 3. Robust Rarity Comparison helper function
CREATE OR REPLACE FUNCTION public.compare_rarity(p_rarity1 TEXT, p_rarity2 TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_val1 INTEGER;
  v_val2 INTEGER;
BEGIN
  IF p_rarity1 IS NULL OR p_rarity2 IS NULL THEN
    RETURN -999;
  END IF;

  v_val1 := CASE LOWER(TRIM(p_rarity1))
    WHEN 'uncommon' THEN 1 
    WHEN 'rare' THEN 2 
    WHEN 'epic' THEN 3 
    WHEN 'legendary' THEN 4 
    WHEN 'chroma' THEN 5 
    WHEN 'mystical' THEN 6 
    ELSE -999 END;

  v_val2 := CASE LOWER(TRIM(p_rarity2))
    WHEN 'uncommon' THEN 1 
    WHEN 'rare' THEN 2 
    WHEN 'epic' THEN 3 
    WHEN 'legendary' THEN 4 
    WHEN 'chroma' THEN 5 
    WHEN 'mystical' THEN 6 
    ELSE 999 END;

  RETURN v_val1 - v_val2;
END;
$$;

-- 4. Update join_clan RPC with Member Limit check
DROP FUNCTION IF EXISTS public.join_clan(TEXT, UUID);
CREATE OR REPLACE FUNCTION public.join_clan(p_username TEXT, p_clan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_tokens INTEGER;
    v_user_booms JSONB;
    v_clan_name TEXT;
    v_clan_tag TEXT;
    v_clan_tag_color TEXT;
    v_min_tokens INTEGER;
    v_min_rarity TEXT;
    v_min_rarity_count INTEGER;
    v_member_limit INTEGER;
    v_current_members INTEGER;
    v_eligible_count INTEGER := 0;
    v_boom_name TEXT;
    v_count_str TEXT;
BEGIN
    -- Verify user not in clan
    IF EXISTS (SELECT 1 FROM public.users WHERE username = p_username AND clan_id IS NOT NULL) THEN
      RAISE EXCEPTION 'You are already in a clan. Leave it first.';
    END IF;

    -- Get clan requirements & member limit
    SELECT name, tag, tag_color, min_tokens, min_rarity, min_rarity_count, member_limit
    INTO v_clan_name, v_clan_tag, v_clan_tag_color, v_min_tokens, v_min_rarity, v_min_rarity_count, v_member_limit
    FROM public.clans WHERE id = p_clan_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Clan not found.';
    END IF;

    -- Check member limit
    SELECT COUNT(*) INTO v_current_members FROM public.users WHERE clan_id = p_clan_id;
    IF v_current_members >= COALESCE(v_member_limit, 15) THEN
      RAISE EXCEPTION 'Clan is full (member limit is %).', COALESCE(v_member_limit, 15);
    END IF;

    -- Fetch user stats
    SELECT tokens, booms INTO v_user_tokens, v_user_booms FROM public.users WHERE username = p_username;

    -- Check token requirement
    IF v_user_tokens < v_min_tokens THEN
      RAISE EXCEPTION 'You do not meet the token requirement of % tokens.', v_min_tokens;
    END IF;

    -- Check Boom rarity requirement
    IF v_min_rarity_count > 0 THEN
      FOR v_boom_name, v_count_str IN SELECT * FROM jsonb_each_text(v_user_booms)
      LOOP
        IF public.compare_rarity(public.get_boom_rarity(v_boom_name), v_min_rarity) >= 0 THEN
          v_eligible_count := v_eligible_count + COALESCE(v_count_str::INTEGER, 0);
        END IF;
      END LOOP;

      IF v_eligible_count < v_min_rarity_count THEN
        RAISE EXCEPTION 'Requirements not met: You must own at least % % or higher Booms (You have %).', v_min_rarity_count, INITCAP(v_min_rarity), v_eligible_count;
      END IF;
    END IF;

    -- Join clan
    UPDATE public.users 
    SET clan_id = p_clan_id, 
        clan_role = 'member', 
        clan_tag = v_clan_tag, 
        clan_tag_color = v_clan_tag_color 
    WHERE username = p_username;

    -- Log activity
    PERFORM log_user_activity(
      p_username, 
      'clan_join', 
      'Joined clan ' || v_clan_name || ' [' || v_clan_tag || ']', 
      jsonb_build_object('clan_id', p_clan_id, 'clan_name', v_clan_name, 'tag', v_clan_tag)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Joined clan successfully!');
END;
$$;

-- 5. RPC: Buy Clan Upgrade
DROP FUNCTION IF EXISTS public.buy_clan_upgrade(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.buy_clan_upgrade(
  p_username TEXT,
  p_upgrade_type TEXT,
  p_color_value TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_role TEXT;
    v_bank_tokens INTEGER;
    v_member_limit INTEGER;
    v_xp_mult NUMERIC;
    v_unlocked_colors TEXT[];
    v_cost INTEGER;
    v_next_val_num NUMERIC;
    v_next_val_int INTEGER;
BEGIN
    -- Verify user is leader or co_leader
    SELECT clan_id, clan_role INTO v_clan_id, v_role FROM public.users WHERE username = p_username;
    IF v_clan_id IS NULL OR v_role NOT IN ('leader', 'co_leader') THEN
        RAISE EXCEPTION 'Only clan leaders or co-leaders can purchase upgrades.';
    END IF;

    -- Get current clan stats
    SELECT bank_tokens, member_limit, xp_multiplier, unlocked_colors
    INTO v_bank_tokens, v_member_limit, v_xp_mult, v_unlocked_colors
    FROM public.clans
    WHERE id = v_clan_id;

    IF p_upgrade_type = 'member_limit' THEN
        IF v_member_limit >= 30 THEN
            RAISE EXCEPTION 'Member limit upgrade is already at max (30).';
        ELSIF v_member_limit = 25 THEN
            v_cost := 50000;
            v_next_val_int := 30;
        ELSIF v_member_limit = 20 THEN
            v_cost := 25000;
            v_next_val_int := 25;
        ELSE
            v_cost := 10000;
            v_next_val_int := 20;
        END IF;

        IF v_bank_tokens < v_cost THEN
            RAISE EXCEPTION 'Insufficient clan bank tokens. Need % tokens (Have %).', v_cost, v_bank_tokens;
        END IF;

        UPDATE public.clans
        SET bank_tokens = bank_tokens - v_cost,
            member_limit = v_next_val_int
        WHERE id = v_clan_id;

        RETURN jsonb_build_object('success', true, 'message', 'Upgraded member limit to ' || v_next_val_int || '!');

    ELSIF p_upgrade_type = 'xp_multiplier' THEN
        IF v_xp_mult >= 2.0 THEN
            RAISE EXCEPTION 'XP multiplier is already at max (2.0x).';
        ELSIF v_xp_mult >= 1.5 THEN
            v_cost := 75000;
            v_next_val_num := 2.0;
        ELSIF v_xp_mult >= 1.2 THEN
            v_cost := 35000;
            v_next_val_num := 1.5;
        ELSE
            v_cost := 15000;
            v_next_val_num := 1.2;
        END IF;

        IF v_bank_tokens < v_cost THEN
            RAISE EXCEPTION 'Insufficient clan bank tokens. Need % tokens (Have %).', v_cost, v_bank_tokens;
        END IF;

        UPDATE public.clans
        SET bank_tokens = bank_tokens - v_cost,
            xp_multiplier = v_next_val_num
        WHERE id = v_clan_id;

        RETURN jsonb_build_object('success', true, 'message', 'Upgraded XP multiplier to ' || v_next_val_num || 'x!');

    ELSIF p_upgrade_type = 'unlock_color' THEN
        IF p_color_value IS NULL OR p_color_value = '' THEN
            RAISE EXCEPTION 'A color code must be provided.';
        END IF;

        IF p_color_value = ANY(v_unlocked_colors) THEN
            RAISE EXCEPTION 'Color is already unlocked.';
        END IF;

        -- Determine color costs
        IF p_color_value = 'text-pink-500' OR p_color_value = 'text-emerald-400' OR p_color_value = 'text-cyan-400' THEN
            v_cost := 5000;
        ELSIF p_color_value LIKE '%gradient%' THEN
            IF p_color_value LIKE '%yellow-400%' THEN
                v_cost := 20000; -- Gold Gradient
            ELSE
                v_cost := 35000; -- Chroma Gradient
            END IF;
        ELSE
            v_cost := 10000; -- General custom colors
        END IF;

        IF v_bank_tokens < v_cost THEN
            RAISE EXCEPTION 'Insufficient clan bank tokens. Need % tokens (Have %).', v_cost, v_bank_tokens;
        END IF;

        UPDATE public.clans
        SET bank_tokens = bank_tokens - v_cost,
            unlocked_colors = array_append(unlocked_colors, p_color_value)
        WHERE id = v_clan_id;

        RETURN jsonb_build_object('success', true, 'message', 'Unlocked new clan tag color!');

    ELSE
        RAISE EXCEPTION 'Invalid upgrade type.';
    END IF;
END;
$$;

-- 6. RPC: Add Clan XP (handles multiplier and level progression)
DROP FUNCTION IF EXISTS public.add_clan_xp(TEXT, INTEGER);
CREATE OR REPLACE FUNCTION public.add_clan_xp(p_username TEXT, p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_xp_mult NUMERIC;
    v_actual_gain INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    SELECT clan_id INTO v_clan_id FROM public.users WHERE username = p_username;
    IF v_clan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User is not in a clan.');
    END IF;

    -- Get XP multiplier
    SELECT COALESCE(xp_multiplier, 1.0) INTO v_xp_mult FROM public.clans WHERE id = v_clan_id;

    v_actual_gain := ROUND(p_amount * v_xp_mult);

    UPDATE public.clans
    SET xp = xp + v_actual_gain
    WHERE id = v_clan_id
    RETURNING xp INTO v_new_xp;

    -- Level up check (10,000 XP per level)
    v_new_level := 1 + FLOOR(v_new_xp / 10000);
    UPDATE public.clans SET level = v_new_level WHERE id = v_clan_id;

    RETURN jsonb_build_object('success', true, 'message', 'Added ' || v_actual_gain || ' XP to clan.', 'xp_added', v_actual_gain);
END;
$$;

-- 7. Clan-Based Tournaments Setup

-- Create Tournament Clans Table
CREATE TABLE IF NOT EXISTS public.tournament_clans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, clan_id)
);

-- RLS for tournament_clans
ALTER TABLE public.tournament_clans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view tournament clans" ON public.tournament_clans;
CREATE POLICY "Anyone can view tournament clans" ON public.tournament_clans FOR SELECT USING (true);

-- RPC: Join Clan Tournament
DROP FUNCTION IF EXISTS public.join_tournament_clan(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.join_tournament_clan(p_tournament_id UUID, p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
BEGIN
    SELECT clan_id INTO v_clan_id FROM public.users WHERE username = p_username;
    IF v_clan_id IS NULL THEN
        RAISE EXCEPTION 'You must be in a clan to join a clan-based tournament.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.tournaments WHERE id = p_tournament_id AND status = 'active') THEN
        RAISE EXCEPTION 'Tournament is not active.';
    END IF;

    INSERT INTO public.tournament_clans (tournament_id, clan_id)
    VALUES (p_tournament_id, v_clan_id)
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('success', true, 'message', 'Your clan has joined the tournament!');
END;
$$;

-- RPC: Submit Clan Tournament Score (cumulative sum score)
DROP FUNCTION IF EXISTS public.submit_clan_tournament_score(UUID, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION public.submit_clan_tournament_score(p_tournament_id UUID, p_username TEXT, p_score INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
BEGIN
    SELECT clan_id INTO v_clan_id FROM public.users WHERE username = p_username;
    IF v_clan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User is not in a clan.');
    END IF;

    -- Update or insert tournament_clans
    INSERT INTO public.tournament_clans (tournament_id, clan_id, score, games_played, last_played)
    VALUES (p_tournament_id, v_clan_id, p_score, 1, NOW())
    ON CONFLICT (tournament_id, clan_id)
    DO UPDATE SET
        score = public.tournament_clans.score + p_score,
        games_played = public.tournament_clans.games_played + 1,
        last_played = NOW();

    RETURN jsonb_build_object('success', true, 'message', 'Clan tournament score updated!');
END;
$$;

-- Update finalize_tournament RPC (to distribute prizes to winning clan and its members)
DROP FUNCTION IF EXISTS public.finalize_tournament(UUID);
CREATE OR REPLACE FUNCTION public.finalize_tournament(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament RECORD;
  v_winner RECORD;
BEGIN
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;

  IF v_tournament.status = 'ended' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tournament already ended.');
  END IF;

  -- Get top scorer clan
  SELECT * INTO v_winner FROM public.tournament_clans 
  WHERE tournament_id = p_tournament_id 
  ORDER BY score DESC, last_played ASC 
  LIMIT 1;

  IF v_winner IS NOT NULL THEN
    -- Distribute prize to clan bank
    IF v_tournament.prize_tokens > 0 THEN
      UPDATE public.clans 
      SET bank_tokens = bank_tokens + v_tournament.prize_tokens 
      WHERE id = v_winner.clan_id;

      -- Also distribute individual tokens (2,000) to each member of that clan
      UPDATE public.users 
      SET tokens = tokens + 2000 
      WHERE clan_id = v_winner.clan_id;
    END IF;

    -- Distribute prize boom to all members of the winning clan
    IF v_tournament.prize_boom_name IS NOT NULL THEN
      UPDATE public.users 
      SET booms = jsonb_set(
        COALESCE(booms, '{}'::jsonb),
        ARRAY[v_tournament.prize_boom_name],
        to_jsonb(COALESCE((booms->>v_tournament.prize_boom_name)::NUMERIC, 0) + 1)
      )
      WHERE clan_id = v_winner.clan_id;
    END IF;
  END IF;

  UPDATE public.tournaments SET status = 'ended' WHERE id = p_tournament_id;

  RETURN jsonb_build_object('success', true, 'message', 'Tournament finalized. Winning Clan ID: ' || COALESCE(v_winner.clan_id::TEXT, 'None'));
END;
$$;
