-- RPC for atomic trade acceptance
CREATE OR REPLACE FUNCTION accept_trade(trade_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trade RECORD;
  v_sender RECORD;
  v_receiver RECORD;
  v_sender_booms jsonb;
  v_receiver_booms jsonb;
  v_boom_key text;
  v_boom_qty int;
BEGIN
  -- 1. Get Trade
  SELECT * INTO v_trade FROM trades WHERE id = trade_uuid FOR UPDATE;
  
  IF v_trade IS NULL THEN
    RAISE EXCEPTION 'Trade not found';
  END IF;

  IF v_trade.status <> 'pending' THEN
    RAISE EXCEPTION 'Trade is not pending';
  END IF;

  -- 2. Get Users (Lock rows)
  SELECT * INTO v_sender FROM users WHERE id = v_trade.sender_id FOR UPDATE;
  SELECT * INTO v_receiver FROM users WHERE id = v_trade.receiver_id FOR UPDATE;

  IF v_sender IS NULL OR v_receiver IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_sender_booms := v_sender.booms;
  v_receiver_booms := v_receiver.booms;

  -- 3. Verify Sender Assets
  -- Tokens
  IF v_sender.tokens < v_trade.sender_tokens THEN
     RAISE EXCEPTION 'Sender insufficient tokens';
  END IF;
  
  -- Booms
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms)
  LOOP
    IF (v_sender_booms->>v_boom_key)::int < v_boom_qty THEN
        RAISE EXCEPTION 'Sender insufficient boom: %', v_boom_key;
    END IF;
  END LOOP;

  -- 4. Verify Receiver Assets
  -- Tokens
  IF v_receiver.tokens < v_trade.receiver_tokens THEN
     RAISE EXCEPTION 'Receiver insufficient tokens';
  END IF;

  -- Booms
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms)
  LOOP
    IF (v_receiver_booms->>v_boom_key)::int < v_boom_qty THEN
        RAISE EXCEPTION 'Receiver insufficient boom: %', v_boom_key;
    END IF;
  END LOOP;

  -- 5. Execute Transfer
  
  -- SENDER: -Tokens, -Own Booms, +New Tokens, +New Booms
  -- RECEIVER: -Tokens, -Own Booms, +New Tokens, +New Booms
  
  -- Update Booms Logic (Tricky with JSONB, simplify by manipulating in memory logic equiv)
  -- Since we can't easily mutate JSONB in place with complex logic in pure SQL without verbosity, 
  -- we perform the semantic updates.
  
  -- Remove Sender Offered Booms from Sender
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms)
  LOOP
     v_sender_booms := jsonb_set(v_sender_booms, ARRAY[v_boom_key], to_jsonb((v_sender_booms->>v_boom_key)::int - v_boom_qty));
     -- Clean up if 0? Optional, but cleaner. PostgreSQL jsonb doesn't auto-delete keys with 0 values usually
     IF (v_sender_booms->>v_boom_key)::int <= 0 THEN
        v_sender_booms := v_sender_booms - v_boom_key;
     END IF;
  END LOOP;

  -- Add Sender Offered Booms to Receiver
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms)
  LOOP
     v_receiver_booms := jsonb_set(v_receiver_booms, ARRAY[v_boom_key], to_jsonb(COALESCE((v_receiver_booms->>v_boom_key)::int, 0) + v_boom_qty));
  END LOOP;

  -- Remove Receiver Offered Booms from Receiver
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms)
  LOOP
     v_receiver_booms := jsonb_set(v_receiver_booms, ARRAY[v_boom_key], to_jsonb((v_receiver_booms->>v_boom_key)::int - v_boom_qty));
     IF (v_receiver_booms->>v_boom_key)::int <= 0 THEN
        v_receiver_booms := v_receiver_booms - v_boom_key;
     END IF;
  END LOOP;

  -- Add Receiver Offered Booms to Sender
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms)
  LOOP
     v_sender_booms := jsonb_set(v_sender_booms, ARRAY[v_boom_key], to_jsonb(COALESCE((v_sender_booms->>v_boom_key)::int, 0) + v_boom_qty));
  END LOOP;


  -- Commit Updates
  UPDATE users 
  SET 
    tokens = tokens - v_trade.sender_tokens + v_trade.receiver_tokens,
    booms = COALESCE(v_sender_booms, '{}'::jsonb)
  WHERE id = v_trade.sender_id;

  UPDATE users 
  SET 
    tokens = tokens - v_trade.receiver_tokens + v_trade.sender_tokens,
    booms = COALESCE(v_receiver_booms, '{}'::jsonb)
  WHERE id = v_trade.receiver_id;

  -- Update Trade Status
  UPDATE trades
  SET status = 'accepted', updated_at = NOW()
  WHERE id = trade_uuid;

END;
$$;
