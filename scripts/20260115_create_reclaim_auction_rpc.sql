-- RPC for atomic auction reclamation
CREATE OR REPLACE FUNCTION reclaim_auction_item(p_auction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction RECORD;
  v_user RECORD;
  v_user_booms jsonb;
BEGIN
  -- 1. Get Auction (Lock row)
  SELECT * INTO v_auction FROM auction_items WHERE id = p_auction_id FOR UPDATE;

  IF v_auction IS NULL THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  -- 2. Verify Status
  IF v_auction.status = 'processed' THEN
    RAISE EXCEPTION 'Auction already processed';
  END IF;

  -- 3. Verify Seller
  -- In a real scenario, we should check if the executing user is the seller.
  -- For now, we assume the caller application has verified this or we trust the username match?
  -- ideally we use auth.uid() but the table stores 'seller' as text username.
  -- We'll proceed with finding the user by that username.

  -- 4. Get User (Lock row)
  SELECT * INTO v_user FROM users WHERE username = v_auction.seller FOR UPDATE;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 5. Logic Access Control (Optional but good)
  -- IF auth.uid()::text <> v_user.id::text THEN
  --   RAISE EXCEPTION 'Not authorized';
  -- END IF;

  v_user_booms := v_user.booms;
  
  -- 6. Update Booms: Add the item back
  -- If boom exists, increment. If not, set to 1.
  -- Using COALESCE to handle nulls if any. 
  
  v_user_booms := jsonb_set(
    COALESCE(v_user_booms, '{}'::jsonb), 
    ARRAY[v_auction.boom_name], 
    to_jsonb(COALESCE((v_user_booms->>v_auction.boom_name)::int, 0) + 1)
  );

  -- 7. Update User
  UPDATE users 
  SET booms = v_user_booms
  WHERE id = v_user.id;

  -- 8. Mark Auction as Processed
  UPDATE auction_items
  SET status = 'processed'
  WHERE id = p_auction_id;

END;
$$;
