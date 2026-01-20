-- 1. Fix Private Chat RLS Recursion
-- First, drop the recursive policy
DROP POLICY IF EXISTS "Members can see other members in their chats" ON conversation_members;

-- Create a security definer function to check membership without recursion
CREATE OR REPLACE FUNCTION public.check_conversation_membership(p_conversation_id UUID, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_members 
        WHERE conversation_id = p_conversation_id 
        AND user_id = p_user_id
    );
END;
$$;

-- Apply new policy using the helper function
CREATE POLICY "Members can see other members in their chats" ON conversation_members
FOR SELECT USING (
    public.check_conversation_membership(conversation_id, auth.uid()::text)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'owner')
);

-- 2. Fix Trade RPC (accept_trade)
-- Update to use users table and TEXT IDs
CREATE OR REPLACE FUNCTION public.accept_trade(trade_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- 2. Fetch and Lock both Users' inventories from USERS table (not profiles)
  SELECT booms INTO v_sender_booms FROM public.users WHERE id = v_sender_id FOR UPDATE;
  SELECT booms INTO v_receiver_booms FROM public.users WHERE id = v_receiver_id FOR UPDATE;

  IF v_sender_booms IS NULL THEN v_sender_booms := '{}'::jsonb; END IF;
  IF v_receiver_booms IS NULL THEN v_receiver_booms := '{}'::jsonb; END IF;

  -- 3. Verification: Ensure both parties still have the items they offered
  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.sender_booms) LOOP
    IF COALESCE((v_sender_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Verification failed: Sender (%s) no longer has enough %', v_trade.sender_username, v_boom_key;
    END IF;
  END LOOP;

  FOR v_boom_key, v_boom_qty IN SELECT * FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    IF COALESCE((v_receiver_booms->>v_boom_key)::int, 0) < v_boom_qty THEN
      RAISE EXCEPTION 'Verification failed: Receiver (%s) no longer has enough %', v_trade.receiver_username, v_boom_key;
    END IF;
  END LOOP;

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

-- 3. Game Sessions table for Multiplayer PIN system
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin TEXT UNIQUE NOT NULL,
    host_id TEXT NOT NULL,
    host_username TEXT NOT NULL,
    grade INTEGER NOT NULL,
    subject TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    status TEXT DEFAULT 'waiting', -- waiting, playing, finished
    duration INTEGER DEFAULT 120,
    players JSONB DEFAULT '[]', -- List of player objects {username, score}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for game_sessions
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for game_sessions
CREATE POLICY "Anyone can see game sessions" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create sessions" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON game_sessions FOR UPDATE USING (true);
