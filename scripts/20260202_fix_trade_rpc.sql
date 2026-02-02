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

  v_sender_id := v_trade.sender_id::uuid;
  v_receiver_id := v_trade.receiver_id::uuid;

  -- 2. Fetch and Lock Inventories
  SELECT COALESCE(booms, '{}'::jsonb) INTO v_sender_booms FROM public.profiles WHERE id = v_sender_id FOR UPDATE;
  SELECT COALESCE(booms, '{}'::jsonb) INTO v_receiver_booms FROM public.profiles WHERE id = v_receiver_id FOR UPDATE;

  -- 3. Verification
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    IF COALESCE((v_sender_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Sender verification failed: Insufficient %', v_boom_key;
    END IF;
  END LOOP;
  
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    IF COALESCE((v_receiver_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Receiver verification failed: Insufficient %', v_boom_key;
    END IF;
  END LOOP;

  -- 4. Execute Trade (Sender Side)
  -- Remove offered items
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    v_sender_booms := jsonb_set(
        v_sender_booms, 
        ARRAY[v_boom_key], 
        to_jsonb(GREATEST(0, (v_sender_booms->>v_boom_key)::int - v_boom_qty))
    );
    -- If count is 0, remove key
    IF (v_sender_booms->>v_boom_key)::int <= 0 THEN
       v_sender_booms := v_sender_booms - v_boom_key;
    END IF;
  END LOOP;
  -- Add received items
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_sender_booms := jsonb_set(
        v_sender_booms, 
        ARRAY[v_boom_key], 
        to_jsonb(COALESCE((v_sender_booms->>v_boom_key)::int, 0) + v_boom_qty)
    );
  END LOOP;

  -- 5. Execute Trade (Receiver Side) - CRITICAL FIX: Ensure we use the freshly fetched v_receiver_booms
  -- Remove offered items
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_receiver_booms := jsonb_set(
        v_receiver_booms, 
        ARRAY[v_boom_key], 
        to_jsonb(GREATEST(0, (v_receiver_booms->>v_boom_key)::int - v_boom_qty))
    );
    IF (v_receiver_booms->>v_boom_key)::int <= 0 THEN
       v_receiver_booms := v_receiver_booms - v_boom_key;
    END IF;
  END LOOP;
  -- Add received items
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
     v_receiver_booms := jsonb_set(
        v_receiver_booms, 
        ARRAY[v_boom_key], 
        to_jsonb(COALESCE((v_receiver_booms->>v_boom_key)::int, 0) + v_boom_qty)
    );
  END LOOP;

  -- 6. Update Database
  UPDATE public.profiles 
  SET 
    tokens = tokens - v_trade.sender_tokens + v_trade.receiver_tokens,
    booms = v_sender_booms,
    updated_at = NOW()
  WHERE id = v_sender_id;

  UPDATE public.profiles 
  SET 
    tokens = tokens - v_trade.receiver_tokens + v_trade.sender_tokens,
    booms = v_receiver_booms,
    updated_at = NOW()
  WHERE id = v_receiver_id;

  UPDATE public.trades SET status = 'accepted', updated_at = NOW() WHERE id = trade_uuid;
END;
$$;
