-- CRITICAL: Atomic Trade Acceptance RPC
-- This script ensures that both parties in a trade have their inventories and tokens updated simultaneously.
-- Run this in your Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.accept_trade(trade_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trade RECORD;
  v_sender_id UUID;
  v_receiver_id UUID;
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

  -- Convert text IDs to UUIDs for reliable matching
  v_sender_id := v_trade.sender_id::uuid;
  v_receiver_id := v_trade.receiver_id::uuid;

  -- 2. Fetch and Lock both Users' inventories (public.profiles)
  SELECT booms INTO v_sender_booms FROM public.profiles WHERE id = v_sender_id FOR UPDATE;
  SELECT booms INTO v_receiver_booms FROM public.profiles WHERE id = v_receiver_id FOR UPDATE;

  IF v_sender_booms IS NULL THEN v_sender_booms := '{}'::jsonb; END IF;
  IF v_receiver_booms IS NULL THEN v_receiver_booms := '{}'::jsonb; END IF;

  -- 3. Verification: Ensure both parties still have the items they offered
  -- Check Sender's offerings
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    IF COALESCE((v_sender_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Verification failed: Sender (%s) no longer has enough %', v_trade.sender_username, v_boom_key;
    END IF;
  END LOOP;

  -- Check Receiver's offerings
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    IF COALESCE((v_receiver_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Verification failed: Receiver (%s) no longer has enough %', v_trade.receiver_username, v_boom_key;
    END IF;
  END LOOP;

  -- 4. Calculate Final Inventories (Mental Swap)
  
  -- Step A: SENDER loses their offered items and GAINS receiver's offered items
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    v_sender_booms := jsonb_set(v_sender_booms, ARRAY[v_boom_key], to_jsonb((v_sender_booms->>v_boom_key)::int - v_boom_qty));
    IF (v_sender_booms->>v_boom_key)::int <= 0 THEN
      v_sender_booms := v_sender_booms - v_boom_key;
    END IF;
  END LOOP;
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_sender_booms := jsonb_set(v_sender_booms, ARRAY[v_boom_key], to_jsonb(COALESCE((v_sender_booms->>v_boom_key)::int, 0) + v_boom_qty));
  END LOOP;

  -- Step B: RECEIVER loses their offered items and GAINS sender's offered items
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_receiver_booms := jsonb_set(v_receiver_booms, ARRAY[v_boom_key], to_jsonb((v_receiver_booms->>v_boom_key)::int - v_boom_qty));
    IF (v_receiver_booms->>v_boom_key)::int <= 0 THEN
      v_receiver_booms := v_receiver_booms - v_boom_key;
    END IF;
  END LOOP;
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    v_receiver_booms := jsonb_set(v_receiver_booms, ARRAY[v_boom_key], to_jsonb(COALESCE((v_receiver_booms->>v_boom_key)::int, 0) + v_boom_qty));
  END LOOP;

  -- 5. Commit Final Updates to public.profiles
  -- Update Sender (They lose their tokens, gain receiver's tokens)
  UPDATE public.profiles 
  SET 
    tokens = tokens - v_trade.sender_tokens + v_trade.receiver_tokens,
    booms = v_sender_booms,
    updated_at = NOW()
  WHERE id = v_sender_id;

  -- Update Receiver (They lose their tokens, gain sender's tokens)
  UPDATE public.profiles 
  SET 
    tokens = tokens - v_trade.receiver_tokens + v_trade.sender_tokens,
    booms = v_receiver_booms,
    updated_at = NOW()
  WHERE id = v_receiver_id;

  -- 6. Success: Mark Trade as Accepted
  UPDATE public.trades 
  SET status = 'accepted', updated_at = NOW() 
  WHERE id = trade_uuid;

END;
$$;
