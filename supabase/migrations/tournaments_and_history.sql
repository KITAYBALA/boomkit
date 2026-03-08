-- ============================================
-- WEEKLY TOURNAMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'ended'
    prize_tokens NUMERIC DEFAULT 0,
    prize_boom_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, username)
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Anyone can view participants" ON public.tournament_participants FOR SELECT USING (true);

-- RPC to join a tournament
DROP FUNCTION IF EXISTS public.join_tournament(UUID, TEXT);
CREATE OR REPLACE FUNCTION join_tournament(p_tournament_id UUID, p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tournaments WHERE id = p_tournament_id AND status = 'active') THEN
    RAISE EXCEPTION 'Tournament is not active.';
  END IF;

  INSERT INTO public.tournament_participants (tournament_id, username)
  VALUES (p_tournament_id, p_username)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'message', 'You have joined the tournament!');
END;
$$;

-- RPC to submit tournament score
-- This updates the score if the new score is higher
DROP FUNCTION IF EXISTS public.submit_tournament_score(UUID, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION submit_tournament_score(p_tournament_id UUID, p_username TEXT, p_score INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.tournament_participants
  SET score = GREATEST(score, p_score),
      games_played = games_played + 1,
      last_played = NOW()
  WHERE tournament_id = p_tournament_id AND username = p_username;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'You are not a participant in this tournament.';
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Score updated!');
END;
$$;

-- RPC to finalize tournament and distribute prizes
DROP FUNCTION IF EXISTS public.finalize_tournament(UUID);
CREATE OR REPLACE FUNCTION finalize_tournament(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_winner RECORD;
BEGIN
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;

  IF v_tournament.status = 'ended' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tournament already ended.');
  END IF;

  -- Get top scorer
  SELECT * INTO v_winner FROM public.tournament_participants 
  WHERE tournament_id = p_tournament_id 
  ORDER BY score DESC, last_played ASC 
  LIMIT 1;

  IF v_winner IS NOT NULL THEN
    -- Distribute tokens
    IF v_tournament.prize_tokens > 0 THEN
      UPDATE public.users SET tokens = tokens + v_tournament.prize_tokens WHERE username = v_winner.username;
    END IF;

    -- Distribute boom
    IF v_tournament.prize_boom_name IS NOT NULL THEN
      UPDATE public.users 
      SET booms = jsonb_set(
        COALESCE(booms, '{}'::jsonb),
        ARRAY[v_tournament.prize_boom_name],
        to_jsonb(COALESCE((booms->>v_tournament.prize_boom_name)::NUMERIC, 0) + 1)
      )
      WHERE username = v_winner.username;
    END IF;
  END IF;

  UPDATE public.tournaments SET status = 'ended' WHERE id = p_tournament_id;

  RETURN jsonb_build_object('success', true, 'message', 'Tournament finalized. Winner: ' || COALESCE(v_winner.username, 'None'));
END;
$$;

-- ============================================
-- USER ACTIVITY HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    activity_type TEXT NOT NULL, -- 'craft', 'rent', 'win', 'gift', 'login'
    description TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view activity" ON public.user_activity FOR SELECT USING (true);

-- Function to log activity
DROP FUNCTION IF EXISTS public.log_user_activity(TEXT, TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION log_user_activity(p_username TEXT, p_type TEXT, p_desc TEXT, p_details JSONB DEFAULT '{}'::jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_activity (username, activity_type, description, details)
  VALUES (p_username, p_type, p_desc, p_details);
END;
$$;
