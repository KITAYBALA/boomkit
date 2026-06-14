-- Migration 019: Discover Features, Accuracy Tracking, Level Display, and Season Pass Claim Fixes

-- 1. Add discover/accuracy tracking columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS discover_tokens_earned NUMERIC DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS correct_answers_count INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS questions_answered_count INTEGER DEFAULT 0;

-- Comment on new columns
COMMENT ON COLUMN public.users.discover_tokens_earned IS 'Cumulative tokens earned specifically from Discover games';
COMMENT ON COLUMN public.users.correct_answers_count IS 'Cumulative correct answers count across Discover games';
COMMENT ON COLUMN public.users.questions_answered_count IS 'Cumulative questions answered count across Discover games';

-- 2. Update season rewards for active season and default inserts
-- Replace Rare Box with Dragon and Epic Box with Wizard for active Season 1
UPDATE public.season_rewards 
SET reward_value = 'Dragon' 
WHERE reward_type = 'boom' AND reward_value = 'Rare Box';

UPDATE public.season_rewards 
SET reward_value = 'Wizard' 
WHERE reward_type = 'boom' AND reward_value = 'Epic Box';

-- 3. Redefine update_game_score RPC to support accuracy metrics
-- Overload with 4 arguments for backwards compatibility
CREATE OR REPLACE FUNCTION public.update_game_score(
  p_pin TEXT,
  p_player_id TEXT,
  p_player_username TEXT,
  p_score INT
)
RETURNS JSONB AS $$
BEGIN
  RETURN public.update_game_score(p_pin, p_player_id, p_player_username, p_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master function with 5 arguments (adds accuracy)
CREATE OR REPLACE FUNCTION public.update_game_score(
  p_pin TEXT,
  p_player_id TEXT,
  p_player_username TEXT,
  p_score INT,
  p_accuracy INT
)
RETURNS JSONB AS $$
DECLARE
  v_updated_players JSONB;
BEGIN
  -- Update the players array defensively, setting score and accuracy
  UPDATE game_sessions
  SET players = (
    SELECT jsonb_agg(
      CASE 
        WHEN (elem->>'id')::text = p_player_id 
             OR (elem->>'username')::text = p_player_username
             OR LOWER((elem->>'username')::text) = LOWER(p_player_username)
             OR (elem->>'id')::text = p_player_username
             OR (elem->>'username')::text = p_player_id
        THEN 
          jsonb_set(
            jsonb_set(elem, '{score}', to_jsonb(p_score)),
            '{accuracy}', to_jsonb(p_accuracy)
          )
        ELSE elem
      END
    )
    FROM jsonb_array_elements(COALESCE(players, '[]'::jsonb)) AS elem
  )
  WHERE pin = p_pin
  RETURNING players INTO v_updated_players;

  RETURN v_updated_players;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant execute access to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.update_game_score(TEXT, TEXT, TEXT, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_game_score(TEXT, TEXT, TEXT, INT, INT) TO anon, authenticated, service_role;
