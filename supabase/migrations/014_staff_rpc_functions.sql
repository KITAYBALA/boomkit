-- Migration: Create staff database RPCs for tournaments and seasons creation
-- Bypasses frontend-direct RLS checks by executing with SECURITY DEFINER
-- and validating staff authorization based on the user's role.

-- 1. Create Tournament RPC
CREATE OR REPLACE FUNCTION public.create_tournament(
  p_creator_id TEXT,
  p_title TEXT,
  p_description TEXT,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_prize_tokens NUMERIC,
  p_prize_boom_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that the creator is a staff member
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_creator_id
      AND role IN ('owner', 'admin', 'senior_moderator', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff members can create tournaments.';
  END IF;

  -- Insert the tournament
  INSERT INTO public.tournaments (title, description, end_time, prize_tokens, prize_boom_name, status)
  VALUES (p_title, p_description, p_end_time, p_prize_tokens, p_prize_boom_name, 'active');

  RETURN jsonb_build_object('success', true, 'message', 'Tournament created successfully!');
END;
$$;


-- 2. Start New Season RPC
CREATE OR REPLACE FUNCTION public.start_new_season(
  p_creator_id TEXT,
  p_season_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_season_id UUID;
BEGIN
  -- Validate that the creator is a staff member
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_creator_id
      AND role IN ('owner', 'admin', 'senior_moderator', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff members can start new seasons.';
  END IF;

  -- Deactivate current active seasons
  UPDATE public.seasons SET is_active = false WHERE is_active = true;

  -- Insert the new active season
  INSERT INTO public.seasons (name, start_date, end_date, is_active)
  VALUES (p_season_name, NOW(), NOW() + INTERVAL '30 days', true)
  RETURNING id INTO v_new_season_id;

  -- Insert default season rewards
  INSERT INTO public.season_rewards (season_id, tier, xp_required, reward_type, reward_value, is_premium) VALUES
  (v_new_season_id, 1, 100, 'tokens', '1000', FALSE),
  (v_new_season_id, 1, 100, 'tokens', '5000', TRUE),
  (v_new_season_id, 2, 250, 'boom', 'Rare Box', FALSE),
  (v_new_season_id, 2, 250, 'boom', 'Epic Box', TRUE),
  (v_new_season_id, 3, 500, 'tokens', '2500', FALSE),
  (v_new_season_id, 3, 500, 'plus_days', '7', TRUE);

  RETURN jsonb_build_object('success', true, 'message', 'Season started successfully!');
END;
$$;
