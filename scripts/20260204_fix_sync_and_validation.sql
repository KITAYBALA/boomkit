-- Unified Fix: TEXT IDs, Auction Validation, and Trade Persistence
-- Run this in Supabase SQL Editor to resolve Trade, Auction, and Leaderboard bugs.

-- 1. Fix update_game_score to accept TEXT for p_user_id (to match users table)
CREATE OR REPLACE FUNCTION update_game_score(
  p_pin TEXT,
  p_user_id TEXT,
  p_score INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE game_sessions
  SET players = (
    SELECT jsonb_agg(
      CASE 
        WHEN (elem->>'id')::text = p_user_id THEN 
          jsonb_set(elem, '{score}', to_jsonb(p_score))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(players) AS elem
  )
  WHERE pin = p_pin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix accept_trade to be robust and handle TEXT IDs
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
BEGIN
  -- 1. Fetch and Lock the Trade
  SELECT * INTO v_trade FROM public.trades WHERE id = trade_uuid FOR UPDATE;
  
  IF v_trade IS NULL THEN
    RAISE EXCEPTION 'Trade record not found for ID: %', trade_uuid;
  END IF;

  IF v_trade.status <> 'pending' THEN
    RAISE EXCEPTION 'Trade is no longer pending (Current status: %)', v_trade.status;
  END IF;

  v_sender_id := v_trade.sender_id;
  v_receiver_id := v_trade.receiver_id;

  -- 2. Fetch and Lock both Users' records (ORDER BY id to prevent deadlocks)
  -- We lock sender then receiver (or vice versa, but must be consistent)
  IF v_sender_id < v_receiver_id THEN
    SELECT booms INTO v_sender_booms FROM public.users WHERE id = v_sender_id FOR UPDATE;
    SELECT booms INTO v_receiver_booms FROM public.users WHERE id = v_receiver_id FOR UPDATE;
  ELSE
    SELECT booms INTO v_receiver_booms FROM public.users WHERE id = v_receiver_id FOR UPDATE;
    SELECT booms INTO v_sender_booms FROM public.users WHERE id = v_sender_id FOR UPDATE;
  END IF;

  IF v_sender_booms IS NULL THEN v_sender_booms := '{}'::jsonb; END IF;
  IF v_receiver_booms IS NULL THEN v_receiver_booms := '{}'::jsonb; END IF;

  -- 3. Verification: Items & Tokens
  -- Sender items
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    IF COALESCE((v_sender_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Verification failed: % no longer has enough % (Has: %, Needs: %). Full inventory: %', 
        v_trade.sender_username, v_boom_key, COALESCE((v_sender_booms->>v_boom_key)::int, 0), v_boom_qty, v_sender_booms;
    END IF;
  END LOOP;

  -- Receiver items
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    IF COALESCE((v_receiver_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Verification failed: % no longer has enough % (Has: %, Needs: %). Full inventory: %', 
        v_trade.receiver_username, v_boom_key, COALESCE((v_receiver_booms->>v_boom_key)::int, 0), v_boom_qty, v_receiver_booms;
    END IF;
  END LOOP;

  -- Tokens
  IF (SELECT tokens FROM public.users WHERE id = v_sender_id) < v_trade.sender_tokens THEN
      RAISE EXCEPTION 'Sender has insufficient tokens';
  END IF;
  IF (SELECT tokens FROM public.users WHERE id = v_receiver_id) < v_trade.receiver_tokens THEN
      RAISE EXCEPTION 'Receiver has insufficient tokens';
  END IF;

  -- 4. Calculate Final Inventories (Defensive)
  -- Remove from Sender
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    v_sender_booms := jsonb_set(v_sender_booms, ARRAY[v_boom_key], to_jsonb((v_sender_booms->>v_boom_key)::int - v_boom_qty));
    IF (v_sender_booms->>v_boom_key)::int <= 0 THEN v_sender_booms := v_sender_booms - v_boom_key; END IF;
  END LOOP;
  -- Add to Sender from Receiver
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_sender_booms := jsonb_set(v_sender_booms, ARRAY[v_boom_key], to_jsonb(COALESCE((v_sender_booms->>v_boom_key)::int, 0) + v_boom_qty));
  END LOOP;

  -- Remove from Receiver
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_receiver_booms := jsonb_set(v_receiver_booms, ARRAY[v_boom_key], to_jsonb((v_receiver_booms->>v_boom_key)::int - v_boom_qty));
    IF (v_receiver_booms->>v_boom_key)::int <= 0 THEN v_receiver_booms := v_receiver_booms - v_boom_key; END IF;
  END LOOP;
  -- Add to Receiver from Sender
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    v_receiver_booms := jsonb_set(v_receiver_booms, ARRAY[v_boom_key], to_jsonb(COALESCE((v_receiver_booms->>v_boom_key)::int, 0) + v_boom_qty));
  END LOOP;

  -- 5. Execute Database Updates
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

  UPDATE public.trades SET status = 'accepted', updated_at = NOW() WHERE id = trade_uuid;

END;
$$;

-- 3. Enhance Auction place_bid with token check
DROP FUNCTION IF EXISTS public.place_bid(uuid, int, text, text);
CREATE OR REPLACE FUNCTION public.place_bid(p_auction_id uuid, p_amount int, p_username text, p_user_id text)
RETURNS public.auction_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
declare
  updated_row public.auction_items;
  v_user_tokens int;
begin
  -- Check user tokens
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
