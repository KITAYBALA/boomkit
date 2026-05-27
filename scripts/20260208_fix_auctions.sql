-- RPC to securely create an auction
-- Handles:
-- 1. Deducting boom from seller's inventory
-- 2. Creating the auction item
-- 3. Returns the created auction item
CREATE OR REPLACE FUNCTION public.create_auction(
  p_boom_name text,
  p_starting_bid int,
  p_duration_hours int,
  p_user_id text -- Added p_user_id to support custom sessions
)
RETURNS public.auction_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_booms jsonb;
  v_boom_qty int;
  v_new_auction public.auction_items;
  v_ends_at timestamptz;
BEGIN
  -- 1. Get User's Inventory
  SELECT booms INTO v_user_booms FROM public.users WHERE id = p_user_id;
  
  IF v_user_booms IS NULL THEN
     RAISE EXCEPTION 'User inventory not found for ID: %', p_user_id;
  END IF;

  IF NOT (v_user_booms ? p_boom_name) THEN
    RAISE EXCEPTION 'You do not own this boom (% not found in %)', p_boom_name, v_user_booms;
  END IF;
  
  v_boom_qty := (v_user_booms->>p_boom_name)::int;
  
  IF v_boom_qty < 1 THEN
    RAISE EXCEPTION 'You do not own enough of this boom (Qty: %)', v_boom_qty;
  END IF;
  
  -- 2. Deduct Boom
  -- If qty is 1, remove key. If > 1, decrement.
  IF v_boom_qty = 1 THEN
    v_user_booms := v_user_booms - p_boom_name;
  ELSE
    v_user_booms := jsonb_set(v_user_booms, array[p_boom_name], to_jsonb(v_boom_qty - 1));
  END IF;
  
  UPDATE public.users SET booms = v_user_booms WHERE id = p_user_id;
  
  -- 3. Create Auction
  v_ends_at := NOW() + (p_duration_hours || ' hours')::interval;
  
  INSERT INTO public.auction_items (
    boom_name,
    seller,
    current_bid,
    ends_at,
    status
  )
  SELECT
    p_boom_name,
    (SELECT username FROM public.users WHERE id = p_user_id),
    p_starting_bid,
    v_ends_at,
    'active'
  RETURNING * INTO v_new_auction;
  
  RETURN v_new_auction;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_auction(text, int, int, text) TO authenticated;
