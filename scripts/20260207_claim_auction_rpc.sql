-- RPC to securely claim an auction prize
-- Handles:
-- 1. Deducting tokens from winner
-- 2. Awarding boom to winner
-- 3. Paying tokens to seller
-- 4. Marking auction as processed
CREATE OR REPLACE FUNCTION public.claim_auction(p_auction_id uuid, p_user_id text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_auction public.auction_items;
  v_winner_tokens int;
  v_winner_booms jsonb;
  v_seller_id text;
  v_seller_tokens int;
  v_winner_username text;
begin
  -- 1. Get Auction Data
  SELECT * INTO v_auction FROM public.auction_items WHERE id = p_auction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;
  
  IF v_auction.status = 'processed' THEN
    RAISE EXCEPTION 'Auction already processed';
  END IF;
  
  IF NOW() < v_auction.ends_at THEN
    RAISE EXCEPTION 'Auction has not ended yet';
  END IF;

  -- 2. Verify Winner
  -- We need the winner's id. Since auction stores username, we find user by ID and check username matches top_bidder.
  SELECT username, tokens, booms INTO v_winner_username, v_winner_tokens, v_winner_booms 
  FROM public.users WHERE id = p_user_id;

  IF v_winner_username != v_auction.top_bidder THEN
    RAISE EXCEPTION 'You are not the winner of this auction';
  END IF;

  -- 3. Check Tokens
  IF v_winner_tokens < v_auction.current_bid THEN
    RAISE EXCEPTION 'Insufficient tokens to claim prize';
  END IF;

  -- 4. Find Seller
  SELECT id, tokens INTO v_seller_id, v_seller_tokens 
  FROM public.users WHERE username = v_auction.seller;

  -- 5. Execute Transaction
  -- Update Winner
  UPDATE public.users 
  SET 
    tokens = tokens - v_auction.current_bid,
    booms = (
      CASE 
        WHEN booms ? v_auction.boom_name THEN 
          jsonb_set(booms, array[v_auction.boom_name], ((booms->>v_auction.boom_name)::int + 1)::text::jsonb)
        ELSE 
          booms || jsonb_build_object(v_auction.boom_name, 1)
      END
    )
  WHERE id = p_user_id;

  -- Update Seller
  IF v_seller_id IS NOT NULL THEN
    UPDATE public.users 
    SET tokens = tokens + v_auction.current_bid
    WHERE id = v_seller_id;
  END IF;

  -- Update Auction Status
  UPDATE public.auction_items SET status = 'processed' WHERE id = p_auction_id;

end;
$$;
