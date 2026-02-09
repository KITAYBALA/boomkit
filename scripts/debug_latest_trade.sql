-- Debug script to inspect trade and user inventory
DO $$
DECLARE
  v_trade_id UUID; -- I need the trade ID, but I don't have it. I'll pick the latest pending trade.
  v_trade RECORD;
  v_sender_booms JSONB;
  v_sender_id TEXT;
BEGIN
  -- 1. Get the latest pending trade
  SELECT * INTO v_trade FROM public.trades WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1;
  
  IF v_trade IS NULL THEN
    RAISE NOTICE 'No pending trades found.';
    RETURN;
  END IF;

  v_sender_id := v_trade.sender_id;
  
  -- 2. Get sender inventory
  SELECT booms INTO v_sender_booms FROM public.users WHERE id = v_sender_id;

  -- 3. Log details
  RAISE NOTICE 'Trade ID: %', v_trade.id;
  RAISE NOTICE 'Sender: %', v_trade.sender_username;
  RAISE NOTICE 'Trade Booms: %', v_trade.sender_booms;
  RAISE NOTICE 'User Inventory: %', v_sender_booms;
  
  -- 4. Check specific boom presence
  -- Iterate nicely to check what's missing
  -- (This is just for logging/debugging to the console output)
END $$;
