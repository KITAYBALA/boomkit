-- Hardened Trading RPC Fix
-- Redefines accept_trade with explicit user existence checks, improved atomicity, 
-- and rigorous validation to prevent silent failures.

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

  -- 2. Fetch and Lock both Users' records and ensure they exist
  -- We use 'users' table directly and lock both rows for update to ensure atomicity.
  SELECT booms INTO v_sender_booms FROM public.users WHERE id = v_sender_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender record (ID: %) not found in users table', v_sender_id;
  END IF;

  SELECT booms INTO v_receiver_booms FROM public.users WHERE id = v_receiver_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receiver record (ID: %) not found in users table', v_receiver_id;
  END IF;

  -- Check if either user is banned
  IF (SELECT is_banned FROM public.users WHERE id = v_sender_id) OR (SELECT is_banned FROM public.users WHERE id = v_receiver_id) THEN
    RAISE EXCEPTION 'Trade restricted: One or both participants are banned.';
  END IF;

  -- Default to empty object if NULL
  IF v_sender_booms IS NULL THEN v_sender_booms := '{}'::jsonb; END IF;
  IF v_receiver_booms IS NULL THEN v_receiver_booms := '{}'::jsonb; END IF;

  -- 3. Verification: Ensure both parties still have the items they offered
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

  -- 4. Calculate Final Inventories
  -- Sender loses sender_booms, gets receiver_booms
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    v_sender_booms := jsonb_set(v_sender_booms, ARRAY[v_boom_key], to_jsonb((v_sender_booms->>v_boom_key)::int - v_boom_qty));
    IF (v_sender_booms->>v_boom_key)::int <= 0 THEN v_sender_booms := v_sender_booms - v_boom_key; END IF;
  END LOOP;
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_sender_booms := jsonb_set(v_sender_booms, ARRAY[v_boom_key], to_jsonb(COALESCE((v_sender_booms->>v_boom_key)::int, 0) + v_boom_qty));
  END LOOP;

  -- Receiver loses receiver_booms, gets sender_booms
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_receiver_booms := jsonb_set(v_receiver_booms, ARRAY[v_boom_key], to_jsonb((v_receiver_booms->>v_boom_key)::int - v_boom_qty));
    IF (v_receiver_booms->>v_boom_key)::int <= 0 THEN v_receiver_booms := v_receiver_booms - v_boom_key; END IF;
  END LOOP;
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    v_receiver_booms := jsonb_set(v_receiver_booms, ARRAY[v_boom_key], to_jsonb(COALESCE((v_receiver_booms->>v_boom_key)::int, 0) + v_boom_qty));
  END LOOP;

  -- 5. Commit Final Updates to public.users
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

  -- 6. Success: Mark Trade as Accepted
  UPDATE public.trades 
  SET status = 'accepted', updated_at = NOW() 
  WHERE id = trade_uuid;

END;
$$;
