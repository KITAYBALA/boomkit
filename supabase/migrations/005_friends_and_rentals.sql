-- ============================================
-- FRIEND SYSTEM
-- ============================================

-- Friends table: stores friendships (bidirectional)
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_username TEXT NOT NULL,
    friend_username TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_username, friend_username)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view friends" ON public.friends FOR SELECT USING (true);
CREATE POLICY "Anyone can insert friend requests" ON public.friends FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own friend status" ON public.friends FOR UPDATE USING (
  user_username = (SELECT username FROM public.users WHERE id = auth.uid()::text) OR
  friend_username = (SELECT username FROM public.users WHERE id = auth.uid()::text)
);
CREATE POLICY "Users can delete their own friends" ON public.friends FOR DELETE USING (
  user_username = (SELECT username FROM public.users WHERE id = auth.uid()::text) OR
  friend_username = (SELECT username FROM public.users WHERE id = auth.uid()::text)
);

-- Send a friend request
DROP FUNCTION IF EXISTS public.send_friend_request(TEXT, TEXT);
CREATE OR REPLACE FUNCTION send_friend_request(p_from TEXT, p_to TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_from = p_to THEN
    RAISE EXCEPTION 'Cannot add yourself as a friend.';
  END IF;

  -- Check if receiver exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE username = p_to) THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  -- Check if already friends or request exists
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

-- Accept a friend request
DROP FUNCTION IF EXISTS public.accept_friend_request(TEXT, TEXT);
CREATE OR REPLACE FUNCTION accept_friend_request(p_username TEXT, p_from TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.friends
  SET status = 'accepted'
  WHERE user_username = p_from AND friend_username = p_username AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending friend request from this user.';
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'You are now friends with ' || p_from || '!');
END;
$$;

-- Remove a friend / decline request
DROP FUNCTION IF EXISTS public.remove_friend(TEXT, TEXT);
CREATE OR REPLACE FUNCTION remove_friend(p_username TEXT, p_friend TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.friends
  WHERE (user_username = p_username AND friend_username = p_friend)
     OR (user_username = p_friend AND friend_username = p_username);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friendship not found.';
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Removed ' || p_friend || ' from friends.');
END;
$$;

-- ============================================
-- BOOM RENTAL MARKET
-- ============================================

CREATE TABLE IF NOT EXISTS public.boom_rentals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_username TEXT NOT NULL,
    renter_username TEXT DEFAULT NULL,
    boom_name TEXT NOT NULL,
    price_per_session NUMERIC NOT NULL DEFAULT 100,
    sessions_remaining INTEGER NOT NULL DEFAULT 5,
    sessions_total INTEGER NOT NULL DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'rented', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rented_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.boom_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rentals" ON public.boom_rentals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rentals" ON public.boom_rentals FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update their rentals" ON public.boom_rentals FOR UPDATE USING (
  owner_username = (SELECT username FROM public.users WHERE id = auth.uid()::text)
);

-- List a boom for rent
DROP FUNCTION IF EXISTS public.list_boom_rental(TEXT, TEXT, NUMERIC, INTEGER);
CREATE OR REPLACE FUNCTION list_boom_rental(
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
  SELECT booms INTO v_booms FROM public.users WHERE username = p_owner FOR UPDATE;
  v_qty := COALESCE((v_booms->>p_boom_name)::NUMERIC, 0);

  IF v_qty < 1 THEN
    RAISE EXCEPTION 'You do not own this boom.';
  END IF;

  -- Remove 1 from inventory (held in escrow)
  IF v_qty = 1 THEN
    v_booms := v_booms - p_boom_name;
  ELSE
    v_booms := jsonb_set(v_booms, ARRAY[p_boom_name], to_jsonb(v_qty - 1));
  END IF;

  UPDATE public.users SET booms = v_booms WHERE username = p_owner;

  INSERT INTO public.boom_rentals (owner_username, boom_name, price_per_session, sessions_remaining, sessions_total, status)
  VALUES (p_owner, p_boom_name, p_price, p_sessions, p_sessions, 'available');

  -- Log activity
  PERFORM log_user_activity(
    p_owner, 
    'rental_list', 
    'Listed ' || p_boom_name || ' for rent', 
    jsonb_build_object('boom_name', p_boom_name, 'price', p_price, 'sessions', p_sessions)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Listed ' || p_boom_name || ' for rent at ' || p_price || ' tokens/session.');
END;
$$;

-- Rent a boom from the market
DROP FUNCTION IF EXISTS public.rent_boom(TEXT, UUID);
CREATE OR REPLACE FUNCTION rent_boom(p_renter TEXT, p_rental_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rental RECORD;
  v_total_cost NUMERIC;
  v_renter_tokens NUMERIC;
BEGIN
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

  -- Deduct tokens from renter
  UPDATE public.users SET tokens = tokens - v_total_cost WHERE username = p_renter;
  -- Pay owner
  UPDATE public.users SET tokens = tokens + v_total_cost WHERE username = v_rental.owner_username;

  -- Mark as rented
  UPDATE public.boom_rentals 
  SET renter_username = p_renter, status = 'rented', rented_at = NOW()
  WHERE id = p_rental_id;

  -- Log activity for renter
  PERFORM log_user_activity(
    p_renter, 
    'rental_rent', 
    'Rented ' || v_rental.boom_name || ' from ' || v_rental.owner_username, 
    jsonb_build_object('boom_name', v_rental.boom_name, 'owner', v_rental.owner_username, 'total_cost', v_total_cost)
  );

  -- Log activity for owner
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

-- Cancel a rental listing (returns boom to owner)
DROP FUNCTION IF EXISTS public.cancel_rental(TEXT, UUID);
CREATE OR REPLACE FUNCTION cancel_rental(p_owner TEXT, p_rental_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rental RECORD;
  v_booms JSONB;
BEGIN
  SELECT * INTO v_rental FROM public.boom_rentals WHERE id = p_rental_id AND owner_username = p_owner AND status = 'available' FOR UPDATE;

  IF v_rental IS NULL THEN
    RAISE EXCEPTION 'Rental not found or cannot be cancelled.';
  END IF;

  -- Return boom to owner
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
