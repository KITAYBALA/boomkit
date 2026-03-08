-- Add streak tracking columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_streak_claim TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create claim_daily_streak RPC
DROP FUNCTION IF EXISTS public.claim_daily_streak(TEXT);
CREATE OR REPLACE FUNCTION claim_daily_streak(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_last_claim TIMESTAMP WITH TIME ZONE;
  v_hours_since NUMERIC;
  v_new_streak INTEGER;
  v_reward INTEGER;
  v_bonus TEXT := '';
BEGIN
  SELECT id, tokens, login_streak, last_streak_claim 
  INTO v_user FROM public.users WHERE username = p_username FOR UPDATE;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  v_last_claim := v_user.last_streak_claim;

  -- Check if already claimed today
  IF v_last_claim IS NOT NULL AND (v_now - v_last_claim) < INTERVAL '20 hours' THEN
    RAISE EXCEPTION 'You have already claimed your daily streak reward. Come back later!';
  END IF;

  -- Check if streak is maintained (claimed within 48 hours) or reset
  IF v_last_claim IS NULL OR (v_now - v_last_claim) > INTERVAL '48 hours' THEN
    -- Streak resets
    v_new_streak := 1;
  ELSE
    -- Streak continues
    v_new_streak := COALESCE(v_user.login_streak, 0) + 1;
  END IF;

  -- Calculate reward
  v_reward := 50; -- base daily reward

  IF v_new_streak % 30 = 0 THEN
    v_reward := 5000;
    v_bonus := ' (30-DAY STREAK BONUS!)';
  ELSIF v_new_streak % 7 = 0 THEN
    v_reward := 500;
    v_bonus := ' (7-DAY STREAK BONUS!)';
  END IF;

  -- Apply
  UPDATE public.users 
  SET tokens = tokens + v_reward,
      login_streak = v_new_streak,
      last_streak_claim = v_now
  WHERE username = p_username;

  RETURN jsonb_build_object(
    'success', true,
    'streak', v_new_streak,
    'reward', v_reward,
    'message', 'Day ' || v_new_streak || ' streak! +' || v_reward || ' tokens' || v_bonus
  );
END;
$$;

-- Add reactions column to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;
