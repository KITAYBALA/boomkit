-- Drop the existing function first because PostgreSQL doesn't allow changing the return type via CREATE OR REPLACE
DROP FUNCTION IF EXISTS public.accept_trade(uuid);

-- Create the updated function that returns the trade record
CREATE OR REPLACE FUNCTION public.accept_trade(trade_uuid UUID)
RETURNS public.trades
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
  v_updated_trade public.trades;
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
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    IF COALESCE((v_sender_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Verification failed: % no longer has enough %', v_trade.sender_username, v_boom_key;
    END IF;
  END LOOP;

  IF (SELECT tokens FROM public.users WHERE id = v_sender_id) < v_trade.sender_tokens THEN
      RAISE EXCEPTION 'Sender has insufficient tokens';
  END IF;

  -- 4. Calculate Final Inventories
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

  -- 5. Execute Database Updates
  UPDATE public.users SET tokens = tokens - v_trade.sender_tokens + v_trade.receiver_tokens, booms = v_sender_booms WHERE id = v_sender_id;
  UPDATE public.users SET tokens = tokens - v_trade.receiver_tokens + v_trade.sender_tokens, booms = v_receiver_booms WHERE id = v_receiver_id;

  UPDATE public.trades SET status = 'accepted', updated_at = NOW() WHERE id = trade_uuid 
  RETURNING * INTO v_updated_trade;

  RETURN v_updated_trade;
END;
$$;
