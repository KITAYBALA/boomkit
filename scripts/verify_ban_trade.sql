-- Verification Script for Ban Trade Logic

DO $$
DECLARE
  v_banned_user_id text;
  v_active_user_id text;
  v_trade_id uuid;
  v_error_message text;
BEGIN
  RAISE NOTICE 'Starting Verification...';

  -- 1. Setup Test Users
  -- We assume users table exists. We'll try to use existing users or fake ones.
  -- For safety in this environment, we'll just check if the POLICY works by trying to "simulate" an insert as a banned user?
  -- Actually, we can't easily simulate 'auth.uid()' in a DO block without setting local config, which might not persist or be allowed easily.
  -- BUT we can test the RPC logic directly.
  
  -- Create dummy banned user
  INSERT INTO users (id, username, email, is_banned, age, join_date)
  VALUES ('test_banned_user', 'banned_guy', 'banned@test.com', true, 18, NOW())
  ON CONFLICT (id) DO UPDATE SET is_banned = true;

  -- Create dummy active user
  INSERT INTO users (id, username, email, is_banned, age, join_date)
  VALUES ('test_active_user', 'active_guy', 'active@test.com', false, 18, NOW())
  ON CONFLICT (id) DO NOTHING;

  v_banned_user_id := 'test_banned_user';
  v_active_user_id := 'test_active_user';

  -- 2. Test RPC: accept_trade with banned user
  
  -- Insert a fake trade directly (bypassing RLS for setup, as we are superuser in DO block usually, or we assume this script runs as admin)
  INSERT INTO trades (id, sender_id, sender_username, receiver_id, receiver_username, status)
  VALUES (gen_random_uuid(), v_banned_user_id, 'banned_guy', v_active_user_id, 'active_guy', 'pending')
  RETURNING id INTO v_trade_id;

  BEGIN
    PERFORM accept_trade(v_trade_id);
    RAISE EXCEPTION 'RPC failed to block banned user from trading!';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%restricted for banned users%' THEN
      RAISE NOTICE 'SUCCESS: RPC correctly blocked banned user.';
    ELSE
      RAISE EXCEPTION 'RPC failed with unexpected error: %', SQLERRM;
    END IF;
  END;

  -- Cleanup
  DELETE FROM trades WHERE id = v_trade_id;
  DELETE FROM users WHERE id IN (v_banned_user_id, v_active_user_id);
  
  RAISE NOTICE 'Verification Complete.';
END;
$$;
