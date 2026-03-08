-- Create an RPC to safely transfer tokens between users without race conditions
CREATE OR REPLACE FUNCTION transfer_tokens(
  p_sender_id UUID,
  p_receiver_username TEXT,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_tokens NUMERIC;
  v_receiver_id UUID;
  v_receiver_tokens NUMERIC;
BEGIN
  -- 1. Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero.';
  END IF;

  -- 2. Prevent self-transfer
  SELECT id INTO v_receiver_id FROM public.users WHERE username = p_receiver_username;
  IF v_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Receiver not found.';
  END IF;

  IF p_sender_id = v_receiver_id THEN
    RAISE EXCEPTION 'Cannot transfer tokens to yourself.';
  END IF;

  -- 3. Check sender balance
  SELECT tokens INTO v_sender_tokens FROM public.users WHERE id = p_sender_id FOR UPDATE;
  IF v_sender_tokens < p_amount THEN
    RAISE EXCEPTION 'Insufficient tokens.';
  END IF;

  -- 4. Deduct from sender
  UPDATE public.users SET tokens = tokens - p_amount WHERE id = p_sender_id;

  -- 5. Add to receiver
  UPDATE public.users SET tokens = tokens + p_amount WHERE id = v_receiver_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Successfully transferred ' || p_amount || ' tokens to ' || p_receiver_username
  );
END;
$$;
