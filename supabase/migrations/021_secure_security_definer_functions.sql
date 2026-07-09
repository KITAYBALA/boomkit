-- Migration 021: Database Security Hardening
-- Resolves C-03, H-01, H-02, H-04, M-01, M-02, M-03, M-07, L-01

-- 1. Create rate_limits table for persistent serverless rate limiting (H-08)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_time TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on rate_limits (only service role can access it)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. Create claimed_season_rewards table to prevent claims race condition (H-04)
CREATE TABLE IF NOT EXISTS public.claimed_season_rewards (
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.season_rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, reward_id)
);

-- Enable RLS on claimed_season_rewards
ALTER TABLE public.claimed_season_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own claims" ON public.claimed_season_rewards;
CREATE POLICY "Users can view their own claims" ON public.claimed_season_rewards
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid()::text = user_id);

-- 3. Add user_id column to chat_messages for robust slowmode check (M-07)
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 4. Flag legacy SHA-256 password hashes to force reset on next login (L-01)
UPDATE public.users
SET password_reset_required = true
WHERE password_hash ~ '^[a-f0-9]{64}$';

-- 5. Revoke EXECUTE on update_game_score from anon role (M-03)
REVOKE EXECUTE ON FUNCTION public.update_game_score(TEXT, TEXT, TEXT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_game_score(TEXT, TEXT, TEXT, INT, INT) FROM anon;

-- 6. Secure active_boosts INSERT policy (H-02)
DROP POLICY IF EXISTS "Authenticated users can activate a boost" ON public.active_boosts;

-- 7. Secure INSERT policies on core tables (M-01)
DROP POLICY IF EXISTS "Anyone can insert friend requests" ON public.friends;
DROP POLICY IF EXISTS "Authenticated users can insert friend requests" ON public.friends;
CREATE POLICY "Authenticated users can insert friend requests" ON public.friends
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_username = (SELECT username FROM public.users WHERE id = auth.uid()::text));

DROP POLICY IF EXISTS "Anyone can insert rentals" ON public.boom_rentals;
DROP POLICY IF EXISTS "Authenticated users can list rentals" ON public.boom_rentals;
CREATE POLICY "Authenticated users can list rentals" ON public.boom_rentals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_username = (SELECT username FROM public.users WHERE id = auth.uid()::text));

DROP POLICY IF EXISTS "Anyone can post clan chat messages" ON public.clan_chat_messages;
DROP POLICY IF EXISTS "Clan members can post messages" ON public.clan_chat_messages;
CREATE POLICY "Clan members can post messages" ON public.clan_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (SELECT clan_id FROM public.users WHERE id = auth.uid()::text) = clan_id AND
    (SELECT username FROM public.users WHERE id = auth.uid()::text) = username
  );

-- 8. Restrict SELECT policies to enforce authentication and privacy (M-02)
-- public.tournaments
DROP POLICY IF EXISTS "Anyone can view tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Authenticated users can view tournaments" ON public.tournaments;
CREATE POLICY "Authenticated users can view tournaments" ON public.tournaments FOR SELECT USING (auth.uid() IS NOT NULL);

-- public.tournament_participants
DROP POLICY IF EXISTS "Anyone can view participants" ON public.tournament_participants;
DROP POLICY IF EXISTS "Authenticated users can view participants" ON public.tournament_participants;
CREATE POLICY "Authenticated users can view participants" ON public.tournament_participants FOR SELECT USING (auth.uid() IS NOT NULL);

-- public.achievements
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
DROP POLICY IF EXISTS "Authenticated users can view achievements" ON public.achievements;
CREATE POLICY "Authenticated users can view achievements" ON public.achievements FOR SELECT USING (auth.uid() IS NOT NULL);

-- public.user_achievements
DROP POLICY IF EXISTS "Anyone can view user achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Authenticated users can view user achievements" ON public.user_achievements;
CREATE POLICY "Authenticated users can view user achievements" ON public.user_achievements FOR SELECT USING (auth.uid() IS NOT NULL);

-- public.seasons
DROP POLICY IF EXISTS "Anyone can view seasons" ON public.seasons;
DROP POLICY IF EXISTS "Authenticated users can view seasons" ON public.seasons;
CREATE POLICY "Authenticated users can view seasons" ON public.seasons FOR SELECT USING (auth.uid() IS NOT NULL);

-- public.season_rewards
DROP POLICY IF EXISTS "Anyone can view rewards" ON public.season_rewards;
DROP POLICY IF EXISTS "Authenticated users can view rewards" ON public.season_rewards;
CREATE POLICY "Authenticated users can view rewards" ON public.season_rewards FOR SELECT USING (auth.uid() IS NOT NULL);

-- public.shop_items
DROP POLICY IF EXISTS "Anyone can view shop items" ON public.shop_items;
DROP POLICY IF EXISTS "Authenticated users can view shop items" ON public.shop_items;
CREATE POLICY "Authenticated users can view shop items" ON public.shop_items FOR SELECT USING (auth.uid() IS NOT NULL);

-- public.boom_rentals
DROP POLICY IF EXISTS "Anyone can view rentals" ON public.boom_rentals;
DROP POLICY IF EXISTS "Authenticated users can view rentals" ON public.boom_rentals;
CREATE POLICY "Authenticated users can view rentals" ON public.boom_rentals FOR SELECT USING (auth.uid() IS NOT NULL);

-- public.clans
DROP POLICY IF EXISTS "Anyone can view clans" ON public.clans;
DROP POLICY IF EXISTS "Authenticated users can view clans" ON public.clans;
CREATE POLICY "Authenticated users can view clans" ON public.clans FOR SELECT USING (auth.uid() IS NOT NULL);

-- public.tournament_clans
DROP POLICY IF EXISTS "Anyone can view tournament clans" ON public.tournament_clans;
DROP POLICY IF EXISTS "Authenticated users can view tournament clans" ON public.tournament_clans;
CREATE POLICY "Authenticated users can view tournament clans" ON public.tournament_clans FOR SELECT USING (auth.uid() IS NOT NULL);

-- Private SELECT policies
-- public.friends
DROP POLICY IF EXISTS "Anyone can view friends" ON public.friends;
DROP POLICY IF EXISTS "Users can view their own friends" ON public.friends;
CREATE POLICY "Users can view their own friends" ON public.friends
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_username = (SELECT username FROM public.users WHERE id = auth.uid()::text) OR
      friend_username = (SELECT username FROM public.users WHERE id = auth.uid()::text)
    )
  );

-- public.clan_chat_messages
DROP POLICY IF EXISTS "Anyone can view clan chat messages" ON public.clan_chat_messages;
DROP POLICY IF EXISTS "Clan members can view clan chat messages" ON public.clan_chat_messages;
CREATE POLICY "Clan members can view clan chat messages" ON public.clan_chat_messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (SELECT clan_id FROM public.users WHERE id = auth.uid()::text) = clan_id
  );

-- public.user_activity
DROP POLICY IF EXISTS "Anyone can view activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users and staff can view activity" ON public.user_activity;
CREATE POLICY "Users and staff can view activity" ON public.user_activity
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      username = (SELECT username FROM public.users WHERE id = auth.uid()::text) OR
      (SELECT role FROM public.users WHERE id = auth.uid()::text) IN ('owner', 'admin', 'senior_moderator', 'moderator')
    )
  );


-- 9. Redefine all SECURITY DEFINER functions with auth.uid() checks (C-03, H-01)

-- Helper function to verify caller username ownership
CREATE OR REPLACE FUNCTION public.check_user_ownership(p_username TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid()::text <> (SELECT id::text FROM public.users WHERE username = p_username) THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity mismatch.';
  END IF;
END;
$$;

-- staff rpc functions (C-03)
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
  IF auth.uid() IS NOT NULL AND auth.uid()::text <> p_creator_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity mismatch.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_creator_id
      AND role IN ('owner', 'admin', 'senior_moderator', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff members can create tournaments.';
  END IF;

  INSERT INTO public.tournaments (title, description, end_time, prize_tokens, prize_boom_name, status)
  VALUES (p_title, p_description, p_end_time, p_prize_tokens, p_prize_boom_name, 'active');

  RETURN jsonb_build_object('success', true, 'message', 'Tournament created successfully!');
END;
$$;

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
  IF auth.uid() IS NOT NULL AND auth.uid()::text <> p_creator_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity mismatch.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_creator_id
      AND role IN ('owner', 'admin', 'senior_moderator', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff members can start new seasons.';
  END IF;

  UPDATE public.seasons SET is_active = false WHERE is_active = true;

  INSERT INTO public.seasons (name, start_date, end_date, is_active)
  VALUES (p_season_name, NOW(), NOW() + INTERVAL '30 days', true)
  RETURNING id INTO v_new_season_id;

  INSERT INTO public.season_rewards (season_id, tier, xp_required, reward_type, reward_value, is_premium) VALUES
  (v_new_season_id, 1, 100, 'tokens', '1000', FALSE),
  (v_new_season_id, 1, 100, 'tokens', '5000', TRUE),
  (v_new_season_id, 2, 250, 'boom', 'Dragon', FALSE),
  (v_new_season_id, 2, 250, 'boom', 'Wizard', TRUE),
  (v_new_season_id, 3, 500, 'tokens', '2500', FALSE),
  (v_new_season_id, 3, 500, 'plus_days', '7', TRUE);

  RETURN jsonb_build_object('success', true, 'message', 'Season started successfully!');
END;
$$;

-- other rpcs (H-01)
CREATE OR REPLACE FUNCTION public.join_tournament(p_tournament_id UUID, p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.check_user_ownership(p_username);

  IF NOT EXISTS (SELECT 1 FROM public.tournaments WHERE id = p_tournament_id AND status = 'active') THEN
    RAISE EXCEPTION 'Tournament is not active.';
  END IF;

  INSERT INTO public.tournament_participants (tournament_id, username)
  VALUES (p_tournament_id, p_username)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'message', 'You have joined the tournament!');
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_tournament_score(p_tournament_id UUID, p_username TEXT, p_score INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.check_user_ownership(p_username);

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

CREATE OR REPLACE FUNCTION public.finalize_tournament(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_winner RECORD;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'senior_moderator', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff members can finalize tournaments.';
  END IF;

  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;

  IF v_tournament.status = 'ended' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tournament already ended.');
  END IF;

  SELECT * INTO v_winner FROM public.tournament_participants 
  WHERE tournament_id = p_tournament_id 
  ORDER BY score DESC, last_played ASC 
  LIMIT 1;

  IF v_winner IS NOT NULL THEN
    IF v_tournament.prize_tokens > 0 THEN
      UPDATE public.users SET tokens = tokens + v_tournament.prize_tokens WHERE username = v_winner.username;
    END IF;

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

CREATE OR REPLACE FUNCTION public.check_achievements(p_username TEXT, p_type TEXT, p_value INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ach RECORD;
    v_count INTEGER := 0;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    FOR v_ach IN 
        SELECT * FROM public.achievements 
        WHERE requirement_type = p_type AND requirement_value <= p_value
        AND id NOT IN (SELECT achievement_id FROM public.user_achievements WHERE username = p_username)
    LOOP
        INSERT INTO public.user_achievements (username, achievement_id) VALUES (p_username, v_ach.id);
        UPDATE public.users SET tokens = tokens + v_ach.reward_tokens WHERE username = p_username;
        v_count := v_count + 1;
        
        PERFORM log_user_activity(
            p_username, 
            'achievement', 
            'Earned achievement: ' || v_ach.name, 
            jsonb_build_object('achievement_id', v_ach.id, 'reward', v_ach.reward_tokens)
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'awarded_count', v_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.buy_shop_item(p_username TEXT, p_item_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_tokens NUMERIC;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT * INTO v_item FROM public.shop_items WHERE id = p_item_id AND is_active = TRUE FOR UPDATE;
    IF v_item IS NULL THEN RAISE EXCEPTION 'Item not found.'; END IF;
    IF v_item.stock = 0 THEN RAISE EXCEPTION 'Item out of stock.'; END IF;

    SELECT tokens INTO v_tokens FROM public.users WHERE username = p_username FOR UPDATE;
    IF v_tokens < v_item.token_cost THEN RAISE EXCEPTION 'Not enough tokens.'; END IF;

    UPDATE public.users SET tokens = tokens - v_item.token_cost WHERE username = p_username;
    
    UPDATE public.users 
    SET booms = jsonb_set(
        COALESCE(booms, '{}'::jsonb),
        ARRAY[v_item.boom_name],
        to_jsonb(COALESCE((booms->>v_item.boom_name)::NUMERIC, 0) + 1)
    )
    WHERE username = p_username;

    IF v_item.stock > 0 THEN
        UPDATE public.shop_items SET stock = stock - 1 WHERE id = p_item_id;
    END IF;

    PERFORM log_user_activity(
        p_username, 
        'shop_purchase', 
        'Bought ' || v_item.boom_name || ' from shop', 
        jsonb_build_object('boom', v_item.boom_name, 'cost', v_item.token_cost)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Purchased ' || v_item.boom_name || '!');
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_season_reward(p_username TEXT, p_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward RECORD;
    v_user RECORD;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT * INTO v_reward FROM public.season_rewards WHERE id = p_reward_id;
    SELECT * INTO v_user FROM public.users WHERE username = p_username FOR UPDATE;

    IF v_user.season_xp < v_reward.xp_required THEN RAISE EXCEPTION 'Insufficient XP for this tier.'; END IF;
    IF v_reward.is_premium AND NOT v_user.has_plus_pass THEN RAISE EXCEPTION 'Premium pass required.'; END IF;

    IF EXISTS (SELECT 1 FROM public.user_activity WHERE username = p_username AND activity_type = 'season_claim' AND (details->>'reward_id')::UUID = p_reward_id) THEN
        RAISE EXCEPTION 'Reward already claimed.';
    END IF;

    IF v_reward.reward_type = 'tokens' THEN
        UPDATE public.users SET tokens = tokens + v_reward.reward_value::NUMERIC WHERE username = p_username;
    ELSIF v_reward.reward_type = 'boom' THEN
        UPDATE public.users 
        SET booms = jsonb_set(
            COALESCE(booms, '{}'::jsonb),
            ARRAY[v_reward.reward_value],
            to_jsonb(COALESCE((booms->>v_reward.reward_value)::NUMERIC, 0) + 1)
        )
        WHERE username = p_username;
    ELSIF v_reward.reward_type = 'plus_days' THEN
        UPDATE public.users SET role = 'tester' WHERE username = p_username AND role = 'user';
    END IF;

    PERFORM log_user_activity(
        p_username, 
        'season_claim', 
        'Claimed tier ' || v_reward.tier || ' season reward', 
        jsonb_build_object('reward_id', p_reward_id, 'type', v_reward.reward_type)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Reward claimed!');
END;
$$;

CREATE OR REPLACE FUNCTION public.craft_boom(
    p_player_username TEXT,
    p_recipe_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recipe RECORD;
    v_player_tokens NUMERIC;
    v_player_booms JSONB;
    v_input_key TEXT;
    v_input_qty NUMERIC;
    v_player_qty NUMERIC;
BEGIN
    PERFORM public.check_user_ownership(p_player_username);

    SELECT * INTO v_recipe FROM public.craft_recipes WHERE id = p_recipe_id;
    IF v_recipe IS NULL THEN
        RAISE EXCEPTION 'Recipe not found.';
    END IF;

    SELECT tokens, booms INTO v_player_tokens, v_player_booms 
    FROM public.users WHERE username = p_player_username FOR UPDATE;

    IF v_player_tokens IS NULL THEN
        RAISE EXCEPTION 'Player not found.';
    END IF;

    IF v_player_tokens < v_recipe.token_cost THEN
        RAISE EXCEPTION 'Not enough tokens to craft this item.';
    END IF;

    FOR v_input_key, v_input_qty IN SELECT * FROM jsonb_each_text(v_recipe.inputs) LOOP
        v_player_qty := COALESCE((v_player_booms->>v_input_key)::NUMERIC, 0);
        IF v_player_qty < v_input_qty::NUMERIC THEN
            RAISE EXCEPTION 'Missing required materials: % x%', v_input_qty, v_input_key;
        END IF;
    END LOOP;

    UPDATE public.users SET tokens = tokens - v_recipe.token_cost WHERE username = p_player_username;
    
    FOR v_input_key, v_input_qty IN SELECT * FROM jsonb_each_text(v_recipe.inputs) LOOP
        v_player_qty := COALESCE((v_player_booms->>v_input_key)::NUMERIC, 0);
        IF v_player_qty = v_input_qty::NUMERIC THEN
            v_player_booms := v_player_booms - v_input_key;
        ELSE
            v_player_booms := jsonb_set(v_player_booms, ARRAY[v_input_key], to_jsonb(v_player_qty - v_input_qty::NUMERIC));
        END IF;
    END LOOP;

    v_player_booms := jsonb_set(
        v_player_booms, 
        ARRAY[v_recipe.output_boom], 
        to_jsonb(COALESCE((v_player_booms->>v_recipe.output_boom)::NUMERIC, 0) + 1)
    );

    UPDATE public.users SET booms = v_player_booms WHERE username = p_player_username;

    PERFORM log_user_activity(
        p_player_username, 
        'craft', 
        'Crafted ' || v_recipe.output_boom, 
        jsonb_build_object('output', v_recipe.output_boom, 'recipe_id', p_recipe_id)
    );

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Successfully crafted ' || v_recipe.output_boom || '!'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.send_friend_request(p_from TEXT, p_to TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.check_user_ownership(p_from);

  IF p_from = p_to THEN
    RAISE EXCEPTION 'Cannot add yourself as a friend.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE username = p_to) THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.friends 
    WHERE (user_username = p_from AND friend_username = p_to)
       OR (user_username = p_to AND friend_username = p_from)
  ) THEN
    RAISE EXCEPTION 'Friend request already exists or you are already friends.';
  END IF;

  INSERT INTO public.friends (user_username, friend_username, status)
  VALUES (p_from, p_to, 'pending');

  RETURN jsonb_build_object('success', true, 'message', 'Friend request sent to ' || p_to || '!');
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_friend_request(p_username TEXT, p_from TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.check_user_ownership(p_username);

  UPDATE public.friends
  SET status = 'accepted'
  WHERE user_username = p_from AND friend_username = p_username AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending friend request from this user.';
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'You are now friends with ' || p_from || '!');
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_friend(p_username TEXT, p_friend TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.check_user_ownership(p_username);

  DELETE FROM public.friends
  WHERE (user_username = p_username AND friend_username = p_friend)
     OR (user_username = p_friend AND friend_username = p_username);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friendship not found.';
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Removed ' || p_friend || ' from friends.');
END;
$$;

CREATE OR REPLACE FUNCTION public.list_boom_rental(
    p_owner TEXT,
    p_boom_name TEXT,
    p_price NUMERIC,
    p_sessions INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booms JSONB;
  v_qty NUMERIC;
BEGIN
  PERFORM public.check_user_ownership(p_owner);

  SELECT booms INTO v_booms FROM public.users WHERE username = p_owner FOR UPDATE;
  v_qty := COALESCE((v_booms->>p_boom_name)::NUMERIC, 0);

  IF v_qty < 1 THEN
    RAISE EXCEPTION 'You do not own this boom.';
  END IF;

  IF v_qty = 1 THEN
    v_booms := v_booms - p_boom_name;
  ELSE
    v_booms := jsonb_set(v_booms, ARRAY[p_boom_name], to_jsonb(v_qty - 1));
  END IF;

  UPDATE public.users SET booms = v_booms WHERE username = p_owner;

  INSERT INTO public.boom_rentals (owner_username, boom_name, price_per_session, sessions_remaining, sessions_total, status)
  VALUES (p_owner, p_boom_name, p_price, p_sessions, p_sessions, 'available');

  PERFORM log_user_activity(
    p_owner, 
    'rental_list', 
    'Listed ' || p_boom_name || ' for rent', 
    jsonb_build_object('boom_name', p_boom_name, 'price', p_price, 'sessions', p_sessions)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Listed ' || p_boom_name || ' for rent at ' || p_price || ' tokens/session.');
END;
$$;

CREATE OR REPLACE FUNCTION public.rent_boom(p_renter TEXT, p_rental_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rental RECORD;
  v_total_cost NUMERIC;
  v_renter_tokens NUMERIC;
BEGIN
  PERFORM public.check_user_ownership(p_renter);

  SELECT * INTO v_rental FROM public.boom_rentals WHERE id = p_rental_id AND status = 'available' FOR UPDATE;

  IF v_rental IS NULL THEN
    RAISE EXCEPTION 'Rental not found or already rented.';
  END IF;

  IF v_rental.owner_username = p_renter THEN
    RAISE EXCEPTION 'Cannot rent your own boom.';
  END IF;

  v_total_cost := v_rental.price_per_session * v_rental.sessions_total;

  SELECT tokens INTO v_renter_tokens FROM public.users WHERE username = p_renter;
  IF v_renter_tokens < v_total_cost THEN
    RAISE EXCEPTION 'Not enough tokens. Total cost: %', v_total_cost;
  END IF;

  UPDATE public.users SET tokens = tokens - v_total_cost WHERE username = p_renter;
  UPDATE public.users SET tokens = tokens + v_total_cost WHERE username = v_rental.owner_username;

  UPDATE public.boom_rentals 
  SET renter_username = p_renter, status = 'rented', rented_at = NOW()
  WHERE id = p_rental_id;

  PERFORM log_user_activity(
    p_renter, 
    'rental_rent', 
    'Rented ' || v_rental.boom_name || ' from ' || v_rental.owner_username, 
    jsonb_build_object('boom_name', v_rental.boom_name, 'owner', v_rental.owner_username, 'total_cost', v_total_cost)
  );

  PERFORM log_user_activity(
    v_rental.owner_username, 
    'rental_earned', 
    p_renter || ' rented your ' || v_rental.boom_name, 
    jsonb_build_object('boom_name', v_rental.boom_name, 'renter', p_renter, 'earned', v_total_cost)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Rented ' || v_rental.boom_name || ' for ' || v_rental.sessions_total || ' sessions! Cost: ' || v_total_cost || ' tokens.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_rental(p_owner TEXT, p_rental_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rental RECORD;
  v_booms JSONB;
BEGIN
  PERFORM public.check_user_ownership(p_owner);

  SELECT * INTO v_rental FROM public.boom_rentals WHERE id = p_rental_id AND owner_username = p_owner AND status = 'available' FOR UPDATE;

  IF v_rental IS NULL THEN
    RAISE EXCEPTION 'Rental not found or cannot be cancelled.';
  END IF;

  SELECT booms INTO v_booms FROM public.users WHERE username = p_owner FOR UPDATE;
  v_booms := jsonb_set(
    COALESCE(v_booms, '{}'::jsonb),
    ARRAY[v_rental.boom_name],
    to_jsonb(COALESCE((v_booms->>v_rental.boom_name)::NUMERIC, 0) + 1)
  );
  UPDATE public.users SET booms = v_booms WHERE username = p_owner;

  UPDATE public.boom_rentals SET status = 'cancelled' WHERE id = p_rental_id;

  RETURN jsonb_build_object('success', true, 'message', 'Cancelled rental and returned ' || v_rental.boom_name || '.');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_rental_session(p_renter TEXT, p_boom_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rental RECORD;
  v_owner_booms JSONB;
BEGIN
  PERFORM public.check_user_ownership(p_renter);

  SELECT * INTO v_rental 
  FROM public.boom_rentals 
  WHERE renter_username = p_renter 
    AND boom_name = p_boom_name 
    AND status = 'rented'
  ORDER BY rented_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_rental IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No active rental found.');
  END IF;

  IF v_rental.sessions_remaining > 1 THEN
    UPDATE public.boom_rentals 
    SET sessions_remaining = sessions_remaining - 1 
    WHERE id = v_rental.id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Session used. Sessions remaining: ' || (v_rental.sessions_remaining - 1));
  ELSE
    UPDATE public.boom_rentals 
    SET sessions_remaining = 0, status = 'completed' 
    WHERE id = v_rental.id;

    SELECT booms INTO v_owner_booms FROM public.users WHERE username = v_rental.owner_username FOR UPDATE;
    v_owner_booms := jsonb_set(
      COALESCE(v_owner_booms, '{}'::jsonb),
      ARRAY[v_rental.boom_name],
      to_jsonb(COALESCE((v_owner_booms->>v_rental.boom_name)::INTEGER, 0) + 1)
    );
    UPDATE public.users SET booms = v_owner_booms WHERE username = v_rental.owner_username;

    PERFORM log_user_activity(
      v_rental.owner_username, 
      'rental_completed', 
      'Your rental listing for ' || v_rental.boom_name || ' has ended and the boom was returned.', 
      jsonb_build_object('boom_name', v_rental.boom_name, 'renter', p_renter)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Rental completed. Boom returned to owner ' || v_rental.owner_username);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.fuse_booms(p_username TEXT, p_boom1 TEXT, p_boom2 TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_booms JSONB;
    v_boom1_count INTEGER;
    v_boom2_count INTEGER;
    v_cooldown_ends TIMESTAMP WITH TIME ZONE;
    v_active_ends TIMESTAMP WITH TIME ZONE;
    v_rarity1 TEXT;
    v_rarity2 TEXT;
    v_highest_rarity TEXT;
    v_duration_seconds INTEGER;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT booms, fusion_cooldown_ends_at, active_fusion_ends_at 
    INTO v_user_booms, v_cooldown_ends, v_active_ends 
    FROM public.users WHERE username = p_username FOR UPDATE;
    
    IF v_cooldown_ends IS NOT NULL AND NOW() < v_cooldown_ends THEN
      RAISE EXCEPTION 'Fusion Lab is on cooldown. Please wait until %.', v_cooldown_ends;
    END IF;

    IF v_active_ends IS NOT NULL THEN
      RAISE EXCEPTION 'You already have a fusion in progress.';
    END IF;

    v_boom1_count := COALESCE((v_user_booms->>p_boom1)::INTEGER, 0);
    v_boom2_count := COALESCE((v_user_booms->>p_boom2)::INTEGER, 0);

    IF p_boom1 = p_boom2 THEN
        IF v_boom1_count < 2 THEN RAISE EXCEPTION 'Insufficient booms to fuse.'; END IF;
    ELSE
        IF v_boom1_count < 1 OR v_boom2_count < 1 THEN RAISE EXCEPTION 'Insufficient booms to fuse.'; END IF;
    END IF;

    v_user_booms := jsonb_set(v_user_booms, ARRAY[p_boom1], to_jsonb(GREATEST(0, (v_user_booms->>p_boom1)::INTEGER - 1)));
    IF (v_user_booms->>p_boom1)::INTEGER <= 0 THEN v_user_booms := v_user_booms - p_boom1; END IF;
    
    v_boom2_count := COALESCE((v_user_booms->>p_boom2)::INTEGER, 0);
    v_user_booms := jsonb_set(v_user_booms, ARRAY[p_boom2], to_jsonb(GREATEST(0, v_boom2_count - 1)));
    IF (v_user_booms->>p_boom2)::INTEGER <= 0 THEN v_user_booms := v_user_booms - p_boom2; END IF;

    v_rarity1 := public.get_boom_rarity(p_boom1);
    v_rarity2 := public.get_boom_rarity(p_boom2);

    IF v_rarity1 = 'mystical' OR v_rarity2 = 'mystical' THEN v_highest_rarity := 'mystical';
    ELSIF v_rarity1 = 'chroma' OR v_rarity2 = 'chroma' THEN v_highest_rarity := 'chroma';
    ELSIF v_rarity1 = 'legendary' OR v_rarity2 = 'legendary' THEN v_highest_rarity := 'legendary';
    ELSIF v_rarity1 = 'epic' OR v_rarity2 = 'epic' THEN v_highest_rarity := 'epic';
    ELSIF v_rarity1 = 'rare' OR v_rarity2 = 'rare' THEN v_highest_rarity := 'rare';
    ELSE v_highest_rarity := 'uncommon';
    END IF;

    IF v_highest_rarity = 'mystical' THEN v_duration_seconds := 3600;
    ELSIF v_highest_rarity = 'chroma' THEN v_duration_seconds := 1800;
    ELSIF v_highest_rarity = 'legendary' THEN v_duration_seconds := 600;
    ELSIF v_highest_rarity = 'epic' THEN v_duration_seconds := 60;
    ELSIF v_highest_rarity = 'rare' THEN v_duration_seconds := 30;
    ELSE v_duration_seconds := 10;
    END IF;

    UPDATE public.users 
    SET booms = v_user_booms,
        active_fusion_boom1 = p_boom1,
        active_fusion_boom2 = p_boom2,
        active_fusion_started_at = NOW(),
        active_fusion_ends_at = NOW() + (v_duration_seconds * INTERVAL '1 second')
    WHERE username = p_username;

    PERFORM log_user_activity(
      p_username, 
      'fusion_start', 
      'Started fusing ' || p_boom1 || ' and ' || p_boom2 || '. Estimated wait time: ' || (v_duration_seconds || ' seconds.'), 
      jsonb_build_object('boom1', p_boom1, 'boom2', p_boom2, 'duration_seconds', v_duration_seconds)
    );

    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Fusion process started! It will take ' || v_duration_seconds || ' seconds.',
      'ends_at', NOW() + (v_duration_seconds * INTERVAL '1 second')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_fusion_result(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_booms JSONB;
    v_boom1 TEXT;
    v_boom2 TEXT;
    v_active_ends TIMESTAMP WITH TIME ZONE;
    v_last_claim TIMESTAMP WITH TIME ZONE;
    v_consecutive INTEGER;
    v_rarity1 TEXT;
    v_rarity2 TEXT;
    v_base_rarity TEXT;
    v_result_rarity TEXT;
    v_result_boom TEXT;
    v_roll INTEGER;
    v_success BOOLEAN := FALSE;
    v_message TEXT;
    v_cooldown_minutes INTEGER;
    v_cooldown_ends TIMESTAMP WITH TIME ZONE;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT booms, active_fusion_boom1, active_fusion_boom2, active_fusion_ends_at, last_fusion_claim_time, consecutive_fusions
    INTO v_user_booms, v_boom1, v_boom2, v_active_ends, v_last_claim, v_consecutive
    FROM public.users WHERE username = p_username FOR UPDATE;

    IF v_boom1 IS NULL OR v_active_ends IS NULL THEN
      RAISE EXCEPTION 'No active fusion to claim.';
    END IF;

    IF NOW() < v_active_ends THEN
      RAISE EXCEPTION 'Fusion is still in progress. Please wait.';
    END IF;

    v_rarity1 := public.get_boom_rarity(v_boom1);
    v_rarity2 := public.get_boom_rarity(v_boom2);
    
    IF v_rarity1 = v_rarity2 THEN
      v_base_rarity := v_rarity1;
    ELSE
      IF v_rarity1 = 'uncommon' OR v_rarity2 = 'uncommon' THEN v_base_rarity := 'uncommon';
      ELSIF v_rarity1 = 'rare' OR v_rarity2 = 'rare' THEN v_base_rarity := 'rare';
      ELSIF v_rarity1 = 'epic' OR v_rarity2 = 'epic' THEN v_base_rarity := 'epic';
      ELSIF v_rarity1 = 'legendary' OR v_rarity2 = 'legendary' THEN v_base_rarity := 'legendary';
      ELSIF v_rarity1 = 'chroma' OR v_rarity2 = 'chroma' THEN v_base_rarity := 'chroma';
      ELSE v_base_rarity := 'mystical';
      END IF;
    END IF;

    v_roll := floor(random() * 100);

    IF v_roll < 30 THEN
      v_success := FALSE;
      v_message := 'The fusion failed! Both materials disintegrated.';
    ELSIF v_roll < 80 THEN
      v_success := TRUE;
      v_result_rarity := v_base_rarity;
      v_result_boom := public.get_random_boom_by_rarity(v_result_rarity);
      v_message := 'Fusion successful! You received a ' || v_result_boom || ' (' || INITCAP(v_result_rarity) || ')';
    ELSE
      v_success := TRUE;
      IF v_base_rarity = 'uncommon' THEN v_result_rarity := 'rare';
      ELSIF v_base_rarity = 'rare' THEN v_result_rarity := 'epic';
      ELSIF v_base_rarity = 'epic' THEN v_result_rarity := 'legendary';
      ELSIF v_base_rarity = 'legendary' THEN v_result_rarity := 'chroma';
      ELSE v_result_rarity := 'mystical';
      END IF;

      v_result_boom := public.get_random_boom_by_rarity(v_result_rarity);
      v_message := 'CRITICAL SUCCESS! You upgraded to a ' || v_result_boom || ' (' || INITCAP(v_result_rarity) || ')! 🎉';
    END IF;

    IF v_success AND v_result_boom IS NOT NULL THEN
        v_user_booms := jsonb_set(
            COALESCE(v_user_booms, '{}'::jsonb), 
            ARRAY[v_result_boom], 
            to_jsonb(COALESCE((v_user_booms->>v_result_boom)::INTEGER, 0) + 1)
        );
    END IF;

    IF v_last_claim IS NULL OR NOW() - v_last_claim > INTERVAL '24 hours' THEN
      v_consecutive := 0;
    END IF;

    v_cooldown_minutes := 5 * power(2, v_consecutive);
    v_cooldown_ends := NOW() + (v_cooldown_minutes * INTERVAL '1 minute');

    UPDATE public.users 
    SET booms = v_user_booms,
        fusion_cooldown_ends_at = v_cooldown_ends,
        consecutive_fusions = v_consecutive + 1,
        last_fusion_claim_time = NOW(),
        active_fusion_boom1 = NULL,
        active_fusion_boom2 = NULL,
        active_fusion_ends_at = NULL,
        active_fusion_started_at = NULL
    WHERE username = p_username;

    PERFORM log_user_activity(
      p_username, 
      'fusion', 
      v_message, 
      jsonb_build_object(
        'boom1', v_boom1, 
        'boom2', v_boom2, 
        'success', v_success, 
        'result', v_result_boom, 
        'cooldown_minutes', v_cooldown_minutes
      )
    );

    RETURN jsonb_build_object(
      'success', v_success, 
      'message', v_message, 
      'result_boom', v_result_boom,
      'cooldown_ends_at', v_cooldown_ends,
      'consecutive_count', v_consecutive + 1
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_daily_streak(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_last_claim TIMESTAMP WITH TIME ZONE;
  v_new_streak INTEGER;
  v_reward INTEGER;
  v_bonus TEXT := '';
BEGIN
  PERFORM public.check_user_ownership(p_username);

  SELECT id, tokens, login_streak, last_streak_claim 
  INTO v_user FROM public.users WHERE username = p_username FOR UPDATE;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  v_last_claim := v_user.last_streak_claim;

  IF v_last_claim IS NOT NULL AND (v_now - v_last_claim) < INTERVAL '20 hours' THEN
    RAISE EXCEPTION 'You have already claimed your daily streak reward. Come back later!';
  END IF;

  IF v_last_claim IS NULL OR (v_now - v_last_claim) > INTERVAL '48 hours' THEN
    v_new_streak := 1;
  ELSE
    v_new_streak := COALESCE(v_user.login_streak, 0) + 1;
  END IF;

  v_reward := 50;

  IF v_new_streak % 30 = 0 THEN
    v_reward := 5000;
    v_bonus := ' (30-DAY STREAK BONUS!)';
  ELSIF v_new_streak % 7 = 0 THEN
    v_reward := 500;
    v_bonus := ' (7-DAY STREAK BONUS!)';
  END IF;

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

CREATE OR REPLACE FUNCTION public.transfer_boom(
  p_sender_username TEXT,
  p_receiver_username TEXT,
  p_boom_name TEXT,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_booms JSONB;
  v_sender_item_count NUMERIC;
  v_receiver_verify TEXT;
  v_receiver_booms JSONB;
BEGIN
  PERFORM public.check_user_ownership(p_sender_username);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero.';
  END IF;

  IF p_sender_username = p_receiver_username THEN
    RAISE EXCEPTION 'Cannot transfer to yourself.';
  END IF;

  SELECT username, booms INTO v_receiver_verify, v_receiver_booms FROM public.users WHERE username = p_receiver_username;
  IF v_receiver_verify IS NULL THEN
    RAISE EXCEPTION 'Receiver not found.';
  END IF;

  SELECT booms INTO v_sender_booms FROM public.users WHERE username = p_sender_username FOR UPDATE;
  
  v_sender_item_count := COALESCE((v_sender_booms->>p_boom_name)::NUMERIC, 0);
  IF v_sender_item_count < p_amount THEN
    RAISE EXCEPTION 'Insufficient boom quantity.';
  END IF;

  IF v_sender_item_count = p_amount THEN
    v_sender_booms := v_sender_booms - p_boom_name;
  ELSE
    v_sender_booms := jsonb_set(COALESCE(v_sender_booms, '{}'::jsonb), ARRAY[p_boom_name], to_jsonb(v_sender_item_count - p_amount));
  END IF;

  UPDATE public.users SET booms = v_sender_booms WHERE username = p_sender_username;

  v_receiver_booms := jsonb_set(
    COALESCE(v_receiver_booms, '{}'::jsonb), 
    ARRAY[p_boom_name], 
    to_jsonb(COALESCE((v_receiver_booms->>p_boom_name)::NUMERIC, 0) + p_amount)
  );

  UPDATE public.users SET booms = v_receiver_booms WHERE username = p_receiver_username;

  PERFORM log_user_activity(
    p_sender_username,
    'gift',
    'Sent ' || p_amount || 'x ' || p_boom_name || ' to ' || p_receiver_username,
    jsonb_build_object('receiver', p_receiver_username, 'boom_name', p_boom_name, 'amount', p_amount)
  );

  PERFORM log_user_activity(
    p_receiver_username,
    'gift',
    'Received ' || p_amount || 'x ' || p_boom_name || ' from ' || p_sender_username,
    jsonb_build_object('sender', p_sender_username, 'boom_name', p_boom_name, 'amount', p_amount)
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Successfully transferred ' || p_amount || 'x ' || p_boom_name || ' to ' || p_receiver_username
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_tokens(
  p_sender_username TEXT,
  p_receiver_username TEXT,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_tokens NUMERIC;
  v_receiver_username TEXT;
  v_receiver_tokens NUMERIC;
BEGIN
  PERFORM public.check_user_ownership(p_sender_username);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero.';
  END IF;

  IF p_sender_username = p_receiver_username THEN
    RAISE EXCEPTION 'Cannot transfer tokens to yourself.';
  END IF;

  SELECT username INTO v_receiver_username FROM public.users WHERE username = p_receiver_username;
  IF v_receiver_username IS NULL THEN
    RAISE EXCEPTION 'Receiver not found.';
  END IF;

  SELECT tokens INTO v_sender_tokens FROM public.users WHERE username = p_sender_username FOR UPDATE;
  IF v_sender_tokens < p_amount THEN
    RAISE EXCEPTION 'Insufficient tokens.';
  END IF;

  UPDATE public.users SET tokens = tokens - p_amount WHERE username = p_sender_username;
  UPDATE public.users SET tokens = tokens + p_amount WHERE username = p_receiver_username;

  PERFORM log_user_activity(
    p_sender_username,
    'transfer',
    'Sent ' || p_amount || ' tokens to ' || p_receiver_username,
    jsonb_build_object('receiver', p_receiver_username, 'amount', p_amount)
  );

  PERFORM log_user_activity(
    p_receiver_username,
    'transfer',
    'Received ' || p_amount || ' tokens from ' || p_sender_username,
    jsonb_build_object('sender', p_sender_username, 'amount', p_amount)
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Successfully transferred ' || p_amount || ' tokens to ' || p_receiver_username
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_trade(trade_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade RECORD;
  v_sender_id TEXT;
  v_receiver_id TEXT;
  v_sender_booms JSONB;
  v_receiver_booms JSONB;
  v_boom_key TEXT;
  v_boom_qty INT;
  v_sender_ip TEXT;
  v_receiver_ip TEXT;
  v_sender_mac TEXT;
  v_receiver_mac TEXT;
BEGIN
  SELECT * INTO v_trade FROM public.trades WHERE id = trade_uuid FOR UPDATE;
  
  IF v_trade IS NULL THEN
    RAISE EXCEPTION 'Trade record not found for ID: %', trade_uuid;
  END IF;

  IF v_trade.status <> 'pending' THEN
    RAISE EXCEPTION 'Trade is no longer pending (Current status: %)', v_trade.status;
  END IF;

  -- Only the receiver can accept the trade
  IF auth.uid() IS NOT NULL AND auth.uid()::text <> v_trade.receiver_id THEN
    RAISE EXCEPTION 'Unauthorized: Only the recipient can accept this trade.';
  END IF;

  v_sender_id := v_trade.sender_id;
  v_receiver_id := v_trade.receiver_id;

  SELECT booms INTO v_sender_booms FROM public.users WHERE id = v_sender_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender record (ID: %) not found in users table', v_sender_id;
  END IF;

  SELECT booms INTO v_receiver_booms FROM public.users WHERE id = v_receiver_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receiver record (ID: %) not found in users table', v_receiver_id;
  END IF;

  IF (SELECT is_banned FROM public.users WHERE id = v_sender_id) OR (SELECT is_banned FROM public.users WHERE id = v_receiver_id) THEN
    RAISE EXCEPTION 'Trade restricted: One or both participants are banned.';
  END IF;

  IF v_sender_booms IS NULL THEN v_sender_booms := '{}'::jsonb; END IF;
  IF v_receiver_booms IS NULL THEN v_receiver_booms := '{}'::jsonb; END IF;

  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    IF COALESCE((v_sender_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Verification failed: % no longer has enough %', v_trade.sender_username, v_boom_key;
    END IF;
  END LOOP;

  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    IF COALESCE((v_receiver_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Verification failed: % no longer has enough %', v_trade.receiver_username, v_boom_key;
    END IF;
  END LOOP;

  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    v_sender_booms := jsonb_set(v_sender_booms, ARRAY[v_boom_key], to_jsonb((v_sender_booms->>v_boom_key)::int - v_boom_qty));
    IF (v_sender_booms->>v_boom_key)::int <= 0 THEN v_sender_booms := v_sender_booms - v_boom_key; END IF;
  END LOOP;
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_sender_booms := jsonb_set(v_sender_booms, ARRAY[v_boom_key], to_jsonb(COALESCE((v_sender_booms->>v_boom_key)::int, 0) + v_boom_qty));
  END LOOP;

  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_receiver_booms := jsonb_set(v_receiver_booms, ARRAY[v_boom_key], to_jsonb((v_receiver_booms->>v_boom_key)::int - v_boom_qty));
    IF (v_receiver_booms->>v_boom_key)::int <= 0 THEN v_receiver_booms := v_receiver_booms - v_boom_key; END IF;
  END LOOP;
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    v_receiver_booms := jsonb_set(v_receiver_booms, ARRAY[v_boom_key], to_jsonb(COALESCE((v_receiver_booms->>v_boom_key)::int, 0) + v_boom_qty));
  END LOOP;

  UPDATE public.users 
  SET 
    tokens = tokens - v_trade.sender_tokens + v_trade.receiver_tokens,
    booms = v_sender_booms
  WHERE id = v_sender_id;

  UPDATE public.users 
  SET 
    tokens = tokens - v_trade.receiver_tokens + v_trade.sender_tokens,
    booms = v_receiver_booms
  WHERE id = v_receiver_id;

  SELECT last_ip, mac_address INTO v_sender_ip, v_sender_mac FROM public.users WHERE id = v_sender_id;
  SELECT last_ip, mac_address INTO v_receiver_ip, v_receiver_mac FROM public.users WHERE id = v_receiver_id;

  IF v_sender_ip IS NOT NULL AND v_receiver_ip IS NOT NULL AND v_sender_ip = v_receiver_ip THEN
    IF v_sender_mac IS DISTINCT FROM v_receiver_mac THEN
      INSERT INTO public.chat_messages (username, message, role)
      VALUES (
        'System 🛡️',
        '⚠️ System Trade Alert: User ' || v_trade.sender_username || ' and User ' || v_trade.receiver_username || ' completed a trade from different devices on the same IP (IP Redacted). Investigation required.',
        'admin'
      );
    END IF;
  END IF;

  UPDATE public.trades 
  SET status = 'accepted', updated_at = NOW() 
  WHERE id = trade_uuid;

END;
$$;

CREATE OR REPLACE FUNCTION public.create_clan(
  p_username TEXT, 
  p_clan_name TEXT, 
  p_tag TEXT, 
  p_description TEXT, 
  p_logo TEXT, 
  p_tag_color TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_tokens INTEGER;
    v_clan_id UUID;
    v_clean_tag TEXT;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT tokens INTO v_user_tokens FROM public.users WHERE username = p_username;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'User not found.';
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.users WHERE username = p_username AND clan_id IS NOT NULL) THEN
      RAISE EXCEPTION 'You are already a member of a clan.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.clans WHERE LOWER(name) = LOWER(p_clan_name)) THEN
      RAISE EXCEPTION 'Clan name is already taken.';
    END IF;

    v_clean_tag := UPPER(TRIM(p_tag));
    IF LENGTH(v_clean_tag) < 3 OR LENGTH(v_clean_tag) > 6 THEN
      RAISE EXCEPTION 'Clan tag must be between 3 and 6 characters.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.clans WHERE UPPER(tag) = v_clean_tag) THEN
      RAISE EXCEPTION 'Clan tag is already taken.';
    END IF;

    IF v_user_tokens < 5000 THEN
      RAISE EXCEPTION 'Insufficient tokens. Creating a clan costs 5,000 tokens.';
    END IF;

    UPDATE public.users SET tokens = tokens - 5000 WHERE username = p_username;
    
    INSERT INTO public.clans (name, tag, tag_color, description, logo, leader)
    VALUES (p_clan_name, v_clean_tag, p_tag_color, p_description, p_logo, p_username)
    RETURNING id INTO v_clan_id;

    UPDATE public.users 
    SET clan_id = v_clan_id, 
        clan_role = 'leader', 
        clan_tag = v_clean_tag, 
        clan_tag_color = p_tag_color 
    WHERE username = p_username;

    PERFORM log_user_activity(
      p_username, 
      'clan_create', 
      'Created clan ' || p_clan_name || ' [' || v_clean_tag || ']', 
      jsonb_build_object('clan_id', v_clan_id, 'clan_name', p_clan_name, 'tag', v_clean_tag)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Clan created successfully!', 'clan_id', v_clan_id);
END;
$$;

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
    PERFORM public.check_user_ownership(p_username);

    IF EXISTS (SELECT 1 FROM public.users WHERE username = p_username AND clan_id IS NOT NULL) THEN
      RAISE EXCEPTION 'You are already in a clan. Leave it first.';
    END IF;

    SELECT name, tag, tag_color, min_tokens, min_rarity, min_rarity_count, member_limit
    INTO v_clan_name, v_clan_tag, v_clan_tag_color, v_min_tokens, v_min_rarity, v_min_rarity_count, v_member_limit
    FROM public.clans WHERE id = p_clan_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Clan not found.';
    END IF;

    SELECT COUNT(*) INTO v_current_members FROM public.users WHERE clan_id = p_clan_id;
    IF v_current_members >= COALESCE(v_member_limit, 15) THEN
      RAISE EXCEPTION 'Clan is full (member limit is %).', COALESCE(v_member_limit, 15);
    END IF;

    SELECT tokens, booms INTO v_user_tokens, v_user_booms FROM public.users WHERE username = p_username;

    IF v_user_tokens < v_min_tokens THEN
      RAISE EXCEPTION 'You do not meet the token requirement of % tokens.', v_min_tokens;
    END IF;

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

    UPDATE public.users 
    SET clan_id = p_clan_id, 
        clan_role = 'member', 
        clan_tag = v_clan_tag, 
        clan_tag_color = v_clan_tag_color 
    WHERE username = p_username;

    PERFORM log_user_activity(
      p_username, 
      'clan_join', 
      'Joined clan ' || v_clan_name || ' [' || v_clan_tag || ']', 
      jsonb_build_object('clan_id', p_clan_id, 'clan_name', v_clan_name, 'tag', v_clan_tag)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Joined clan successfully!');
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_clan(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_clan_role TEXT;
    v_clan_name TEXT;
    v_other_member_count INTEGER;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT clan_id, clan_role INTO v_clan_id, v_clan_role FROM public.users WHERE username = p_username;
    
    IF v_clan_id IS NULL THEN
      RAISE EXCEPTION 'You are not in a clan.';
    END IF;

    SELECT name INTO v_clan_name FROM public.clans WHERE id = v_clan_id;

    IF v_clan_role = 'leader' THEN
      SELECT count(*) INTO v_other_member_count FROM public.users WHERE clan_id = v_clan_id AND username != p_username;
      
      IF v_other_member_count > 0 THEN
        RAISE EXCEPTION 'You must transfer leadership or kick all members before leaving the clan.';
      ELSE
        DELETE FROM public.clans WHERE id = v_clan_id;
      END IF;
    END IF;

    UPDATE public.users 
    SET clan_id = NULL, 
        clan_role = 'member', 
        clan_tag = NULL, 
        clan_tag_color = NULL 
    WHERE username = p_username;

    PERFORM log_user_activity(
      p_username, 
      'clan_leave', 
      'Left clan ' || v_clan_name, 
      jsonb_build_object('clan_id', v_clan_id, 'clan_name', v_clan_name)
    );

    RETURN jsonb_build_object('success', true, 'message', 'You have left the clan.');
END;
$$;

CREATE OR REPLACE FUNCTION public.donate_to_clan(p_username TEXT, p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_user_tokens INTEGER;
    v_xp_gain INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    IF p_amount <= 0 THEN
      RAISE EXCEPTION 'Donation amount must be greater than zero.';
    END IF;

    SELECT clan_id, tokens INTO v_clan_id, v_user_tokens FROM public.users WHERE username = p_username;
    
    IF v_clan_id IS NULL THEN
      RAISE EXCEPTION 'You are not in a clan.';
    END IF;

    IF v_user_tokens < p_amount THEN
      RAISE EXCEPTION 'Insufficient tokens for donation.';
    END IF;

    UPDATE public.users SET tokens = tokens - p_amount WHERE username = p_username;
    
    v_xp_gain := p_amount;
    
    UPDATE public.clans 
    SET bank_tokens = bank_tokens + p_amount,
        xp = xp + v_xp_gain
    WHERE id = v_clan_id
    RETURNING xp INTO v_new_xp;

    v_new_level := 1 + FLOOR(v_new_xp / 10000);
    UPDATE public.clans SET level = v_new_level WHERE id = v_clan_id;

    PERFORM log_user_activity(
      p_username, 
      'clan_donate', 
      'Donated ' || p_amount || ' tokens to the clan bank', 
      jsonb_build_object('clan_id', v_clan_id, 'amount', p_amount)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Thank you for your donation of ' || p_amount || ' tokens!');
END;
$$;

CREATE OR REPLACE FUNCTION public.kick_from_clan(p_username TEXT, p_target_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_caller_role TEXT;
    v_target_clan_id UUID;
    v_target_role TEXT;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT clan_id, clan_role INTO v_clan_id, v_caller_role FROM public.users WHERE username = p_username;
    SELECT clan_id, clan_role INTO v_target_clan_id, v_target_role FROM public.users WHERE username = p_target_username;

    IF v_clan_id IS NULL OR v_caller_role NOT IN ('leader', 'co_leader') THEN
      RAISE EXCEPTION 'You do not have permission to kick members.';
    END IF;

    IF v_target_clan_id IS NULL OR v_target_clan_id != v_clan_id THEN
      RAISE EXCEPTION 'Target user is not in your clan.';
    END IF;

    IF v_caller_role = 'co_leader' AND v_target_role IN ('leader', 'co_leader') THEN
      RAISE EXCEPTION 'Co-leaders cannot kick other co-leaders or the leader.';
    END IF;

    IF p_username = p_target_username THEN
      RAISE EXCEPTION 'You cannot kick yourself. Use Leave Clan instead.';
    END IF;

    UPDATE public.users 
    SET clan_id = NULL, 
        clan_role = 'member', 
        clan_tag = NULL, 
        clan_tag_color = NULL 
    WHERE username = p_target_username;

    PERFORM log_user_activity(
      p_username, 
      'clan_kick', 
      'Kicked ' || p_target_username || ' from the clan', 
      jsonb_build_object('clan_id', v_clan_id, 'target', p_target_username)
    );

    RETURN jsonb_build_object('success', true, 'message', p_target_username || ' has been kicked from the clan.');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_clan_info(
  p_username TEXT, 
  p_description TEXT, 
  p_logo TEXT, 
  p_tag_color TEXT,
  p_min_tokens INTEGER,
  p_min_rarity TEXT,
  p_min_rarity_count INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_role TEXT;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT clan_id, clan_role INTO v_clan_id, v_role FROM public.users WHERE username = p_username;

    IF v_clan_id IS NULL OR v_role NOT IN ('leader', 'co_leader') THEN
      RAISE EXCEPTION 'Only leaders and co-leaders can edit clan settings.';
    END IF;

    IF p_min_tokens < 0 OR p_min_rarity_count < 0 THEN
      RAISE EXCEPTION 'Requirements cannot have negative values.';
    END IF;

    UPDATE public.clans 
    SET description = p_description,
        logo = p_logo,
        tag_color = p_tag_color,
        min_tokens = p_min_tokens,
        min_rarity = LOWER(p_min_rarity),
        min_rarity_count = p_min_rarity_count
    WHERE id = v_clan_id;

    UPDATE public.users 
    SET clan_tag_color = p_tag_color 
    WHERE clan_id = v_clan_id;

    PERFORM log_user_activity(
      p_username, 
      'clan_update', 
      'Updated clan information and settings', 
      jsonb_build_object('clan_id', v_clan_id)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Clan settings updated successfully!');
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_clan_leadership(p_username TEXT, p_target_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_caller_role TEXT;
    v_target_clan_id UUID;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT clan_id, clan_role INTO v_clan_id, v_caller_role FROM public.users WHERE username = p_username;
    SELECT clan_id INTO v_target_clan_id FROM public.users WHERE username = p_target_username;

    IF v_clan_id IS NULL OR v_caller_role != 'leader' THEN
      RAISE EXCEPTION 'Only the clan leader can transfer leadership.';
    END IF;

    IF v_target_clan_id IS NULL OR v_target_clan_id != v_clan_id THEN
      RAISE EXCEPTION 'Target user is not in your clan.';
    END IF;

    UPDATE public.clans SET leader = p_target_username WHERE id = v_clan_id;
    UPDATE public.users SET clan_role = 'member' WHERE username = p_username;
    UPDATE public.users SET clan_role = 'leader' WHERE username = p_target_username;

    PERFORM log_user_activity(
      p_username, 
      'clan_transfer', 
      'Transferred leadership to ' || p_target_username, 
      jsonb_build_object('clan_id', v_clan_id, 'new_leader', p_target_username)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Leadership has been transferred to ' || p_target_username || '.');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_clan_member_role(p_username TEXT, p_target_username TEXT, p_new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
    v_caller_role TEXT;
    v_target_clan_id UUID;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT clan_id, clan_role INTO v_clan_id, v_caller_role FROM public.users WHERE username = p_username;
    SELECT clan_id INTO v_target_clan_id FROM public.users WHERE username = p_target_username;

    IF v_clan_id IS NULL OR v_caller_role != 'leader' THEN
      RAISE EXCEPTION 'Only the clan leader can update member roles.';
    END IF;

    IF v_target_clan_id IS NULL OR v_target_clan_id != v_clan_id THEN
      RAISE EXCEPTION 'Target user is not in your clan.';
    END IF;

    IF p_new_role NOT IN ('co_leader', 'member') THEN
      RAISE EXCEPTION 'Invalid role. Must be co_leader or member.';
    END IF;

    UPDATE public.users SET clan_role = p_new_role WHERE username = p_target_username;

    PERFORM log_user_activity(
      p_username, 
      'clan_promote', 
      'Updated role of ' || p_target_username || ' to ' || p_new_role, 
      jsonb_build_object('clan_id', v_clan_id, 'target', p_target_username, 'role', p_new_role)
    );

    RETURN jsonb_build_object('success', true, 'message', format('%s''s role updated to %s.', p_target_username, INITCAP(REPLACE(p_new_role, '_', ' '))));
END;
$$;

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
    PERFORM public.check_user_ownership(p_username);

    SELECT clan_id, clan_role INTO v_clan_id, v_role FROM public.users WHERE username = p_username;
    IF v_clan_id IS NULL OR v_role NOT IN ('leader', 'co_leader') THEN
        RAISE EXCEPTION 'Only clan leaders or co-leaders can purchase upgrades.';
    END IF;

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

        IF p_color_value = 'text-pink-500' OR p_color_value = 'text-emerald-400' OR p_color_value = 'text-cyan-400' THEN
            v_cost := 5000;
        ELSIF p_color_value LIKE '%gradient%' THEN
            IF p_color_value LIKE '%yellow-400%' THEN
                v_cost := 20000;
            ELSE
                v_cost := 35000;
            END IF;
        ELSE
            v_cost := 10000;
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
    PERFORM public.check_user_ownership(p_username);

    SELECT clan_id INTO v_clan_id FROM public.users WHERE username = p_username;
    IF v_clan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User is not in a clan.');
    END IF;

    SELECT COALESCE(xp_multiplier, 1.0) INTO v_xp_mult FROM public.clans WHERE id = v_clan_id;

    v_actual_gain := ROUND(p_amount * v_xp_mult);

    UPDATE public.clans
    SET xp = xp + v_actual_gain
    WHERE id = v_clan_id
    RETURNING xp INTO v_new_xp;

    v_new_level := 1 + FLOOR(v_new_xp / 10000);
    UPDATE public.clans SET level = v_new_level WHERE id = v_clan_id;

    RETURN jsonb_build_object('success', true, 'message', 'Added ' || v_actual_gain || ' XP to clan.', 'xp_added', v_actual_gain);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_tournament_clan(p_tournament_id UUID, p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
BEGIN
    PERFORM public.check_user_ownership(p_username);

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

CREATE OR REPLACE FUNCTION public.submit_clan_tournament_score(p_tournament_id UUID, p_username TEXT, p_score INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clan_id UUID;
BEGIN
    PERFORM public.check_user_ownership(p_username);

    SELECT clan_id INTO v_clan_id FROM public.users WHERE username = p_username;
    IF v_clan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User is not in a clan.');
    END IF;

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

CREATE OR REPLACE FUNCTION public.update_game_score(
  p_pin TEXT,
  p_player_id TEXT,
  p_player_username TEXT,
  p_score INT
)
RETURNS JSONB AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid()::text <> p_player_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity mismatch.';
  END IF;
  RETURN public.update_game_score(p_pin, p_player_id, p_player_username, p_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  IF auth.uid() IS NOT NULL AND auth.uid()::text <> p_player_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity mismatch.';
  END IF;

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

CREATE OR REPLACE FUNCTION public.create_auction(
  p_boom_name text,
  p_starting_bid int,
  p_duration_hours int,
  p_user_id text
)
RETURNS public.auction_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_booms jsonb;
  v_boom_qty int;
  v_new_auction public.auction_items;
  v_ends_at timestamptz;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid()::text <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity mismatch.';
  END IF;

  SELECT booms INTO v_user_booms FROM public.users WHERE id = p_user_id;
  
  IF v_user_booms IS NULL THEN
     RAISE EXCEPTION 'User inventory not found for ID: %', p_user_id;
  END IF;

  IF NOT (v_user_booms ? p_boom_name) THEN
    RAISE EXCEPTION 'You do not own this boom (% not found in %)', p_boom_name, v_user_booms;
  END IF;
  
  v_boom_qty := (v_user_booms->>p_boom_name)::int;
  
  IF v_boom_qty < 1 THEN
    RAISE EXCEPTION 'You do not own enough of this boom (Qty: %)', v_boom_qty;
  END IF;
  
  IF v_boom_qty = 1 THEN
    v_user_booms := v_user_booms - p_boom_name;
  ELSE
    v_user_booms := jsonb_set(v_user_booms, array[p_boom_name], to_jsonb(v_boom_qty - 1));
  END IF;
  
  UPDATE public.users SET booms = v_user_booms WHERE id = p_user_id;
  
  v_ends_at := NOW() + (p_duration_hours || ' hours')::interval;
  
  INSERT INTO public.auction_items (
    boom_name,
    seller,
    current_bid,
    ends_at,
    status
  )
  SELECT
    p_boom_name,
    (SELECT username FROM public.users WHERE id = p_user_id),
    p_starting_bid,
    v_ends_at,
    'active'
  RETURNING * INTO v_new_auction;
  
  RETURN v_new_auction;
END;
$$;

CREATE OR REPLACE FUNCTION public.place_bid(p_auction_id uuid, p_amount int, p_username text, p_user_id text)
RETURNS public.auction_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
declare
  updated_row public.auction_items;
  v_user_tokens int;
begin
  IF auth.uid() IS NOT NULL AND auth.uid()::text <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity mismatch.';
  END IF;

  SELECT tokens INTO v_user_tokens FROM public.users WHERE id = p_user_id;
  IF v_user_tokens < p_amount THEN
    raise exception 'Bid rejected: Insufficient tokens (You have %, bid is %)', v_user_tokens, p_amount;
  END IF;

  update public.auction_items
  set
    current_bid = p_amount,
    top_bidder = p_username,
    bidders = bidders || jsonb_build_array(json_build_object('username', p_username, 'amount', p_amount, 'at', now()))
  where id = p_auction_id
    and now() < ends_at
    and p_amount > current_bid
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'Bid rejected: auction ended or amount too low';
  end if;

  return updated_row;
end;
$body$;

CREATE OR REPLACE FUNCTION public.claim_auction(p_auction_id uuid, p_user_id text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_auction public.auction_items;
  v_winner_tokens int;
  v_winner_booms jsonb;
  v_seller_id text;
  v_seller_tokens int;
  v_winner_username text;
begin
  IF auth.uid() IS NOT NULL AND auth.uid()::text <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity mismatch.';
  END IF;

  SELECT * INTO v_auction FROM public.auction_items WHERE id = p_auction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;
  
  IF v_auction.status = 'processed' THEN
    RAISE EXCEPTION 'Auction already processed';
  END IF;
  
  IF NOW() < v_auction.ends_at THEN
    RAISE EXCEPTION 'Auction has not ended yet';
  END IF;

  SELECT username, tokens, booms INTO v_winner_username, v_winner_tokens, v_winner_booms 
  FROM public.users WHERE id = p_user_id;

  IF v_winner_username != v_auction.top_bidder THEN
    RAISE EXCEPTION 'You are not the winner of this auction';
  END IF;

  IF v_winner_tokens < v_auction.current_bid THEN
    RAISE EXCEPTION 'Insufficient tokens to claim prize';
  END IF;

  SELECT id, tokens INTO v_seller_id, v_seller_tokens 
  FROM public.users WHERE username = v_auction.seller;

  UPDATE public.users 
  SET 
    tokens = tokens - v_auction.current_bid,
    booms = (
      CASE 
        WHEN booms ? v_auction.boom_name THEN 
          jsonb_set(booms, array[v_auction.boom_name], ((booms->>v_auction.boom_name)::int + 1)::text::jsonb)
        ELSE 
          booms || jsonb_build_object(v_auction.boom_name, 1)
      END
    )
  WHERE id = p_user_id;

  IF v_seller_id IS NOT NULL THEN
    UPDATE public.users 
    SET tokens = tokens + v_auction.current_bid
    WHERE id = v_seller_id;
  END IF;

  UPDATE public.auction_items SET status = 'processed' WHERE id = p_auction_id;

end;
$$;

CREATE OR REPLACE FUNCTION public.reclaim_auction_item(p_auction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction RECORD;
  v_user RECORD;
  v_user_booms jsonb;
BEGIN
  SELECT * INTO v_auction FROM auction_items WHERE id = p_auction_id FOR UPDATE;

  IF v_auction IS NULL THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  IF v_auction.status = 'processed' THEN
    RAISE EXCEPTION 'Auction already processed';
  END IF;

  SELECT * INTO v_user FROM users WHERE username = v_auction.seller FOR UPDATE;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid()::text <> v_user.id::text THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_user_booms := v_user.booms;
  
  v_user_booms := jsonb_set(
    COALESCE(v_user_booms, '{}'::jsonb), 
    ARRAY[v_auction.boom_name], 
    to_jsonb(COALESCE((v_user_booms->>v_auction.boom_name)::int, 0) + 1)
  );

  UPDATE users 
  SET booms = v_user_booms
  WHERE id = v_user.id;

  UPDATE auction_items
  SET status = 'processed'
  WHERE id = p_auction_id;

END;
$$;
