-- Drop existing function if it exists to avoid parameter name mismatch errors
DROP FUNCTION IF EXISTS public.transfer_tokens(TEXT, TEXT, NUMERIC);

-- Create an RPC to safely transfer tokens between users without race conditions
CREATE OR REPLACE FUNCTION transfer_tokens(
  p_sender_username TEXT,
  p_receiver_username TEXT,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_tokens NUMERIC;
  v_receiver_username TEXT;
  v_receiver_tokens NUMERIC;
BEGIN
  -- 1. Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero.';
  END IF;

  -- 2. Prevent self-transfer
  IF p_sender_username = p_receiver_username THEN
    RAISE EXCEPTION 'Cannot transfer tokens to yourself.';
  END IF;

  -- 3. Check if receiver exists
  SELECT username INTO v_receiver_username FROM public.users WHERE username = p_receiver_username;
  IF v_receiver_username IS NULL THEN
    RAISE EXCEPTION 'Receiver not found.';
  END IF;

  -- 4. Check sender balance
  SELECT tokens INTO v_sender_tokens FROM public.users WHERE username = p_sender_username FOR UPDATE;
  IF v_sender_tokens < p_amount THEN
    RAISE EXCEPTION 'Insufficient tokens.';
  END IF;

  -- 5. Deduct from sender
  UPDATE public.users SET tokens = tokens - p_amount WHERE username = p_sender_username;

  -- 6. Add to receiver
  UPDATE public.users SET tokens = tokens + p_amount WHERE username = p_receiver_username;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Successfully transferred ' || p_amount || ' tokens to ' || p_receiver_username
  );
END;
$$;
