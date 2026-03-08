CREATE OR REPLACE FUNCTION transfer_boom(
  p_sender_id UUID,
  p_receiver_username TEXT,
  p_boom_name TEXT,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_booms JSONB;
  v_sender_item_count NUMERIC;
  v_receiver_id UUID;
  v_receiver_booms JSONB;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero.';
  END IF;

  SELECT id, booms INTO v_receiver_id, v_receiver_booms FROM public.users WHERE username = p_receiver_username;
  IF v_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Receiver not found.';
  END IF;

  IF p_sender_id = v_receiver_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself.';
  END IF;

  SELECT booms INTO v_sender_booms FROM public.users WHERE id = p_sender_id FOR UPDATE;
  
  v_sender_item_count := COALESCE((v_sender_booms->>p_boom_name)::NUMERIC, 0);
  IF v_sender_item_count < p_amount THEN
    RAISE EXCEPTION 'Insufficient boom quantity.';
  END IF;

  -- Deduct from sender
  IF v_sender_item_count = p_amount THEN
    -- Remove the key if balance reaches 0 to keep jsonb clean
    v_sender_booms := v_sender_booms - p_boom_name;
  ELSE
    v_sender_booms := jsonb_set(COALESCE(v_sender_booms, '{}'::jsonb), ARRAY[p_boom_name], to_jsonb(v_sender_item_count - p_amount));
  END IF;

  UPDATE public.users SET booms = v_sender_booms WHERE id = p_sender_id;

  -- Add to receiver
  v_receiver_booms := jsonb_set(
    COALESCE(v_receiver_booms, '{}'::jsonb), 
    ARRAY[p_boom_name], 
    to_jsonb(COALESCE((v_receiver_booms->>p_boom_name)::NUMERIC, 0) + p_amount)
  );

  UPDATE public.users SET booms = v_receiver_booms WHERE id = v_receiver_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Successfully transferred ' || p_amount || 'x ' || p_boom_name || ' to ' || p_receiver_username
  );
END;
$$;
