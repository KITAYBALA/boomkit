-- 1. Fix Auction House Table Schema
-- Ensure 'bidders' is JSONB (for rich history) and 'ends_at' is TIMESTAMPTZ
ALTER TABLE public.auction_items 
  DROP COLUMN IF EXISTS bidders,
  DROP COLUMN IF EXISTS time_left;

ALTER TABLE public.auction_items 
  ADD COLUMN IF NOT EXISTS bidders JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS top_bidder_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ALTER COLUMN id TYPE UUID USING (id::uuid),
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Robust place_bid RPC
-- We must drop first because we might be changing the return type
DROP FUNCTION IF EXISTS public.place_bid(UUID, INT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.place_bid(
  p_auction_id UUID, 
  p_amount INT, 
  p_username TEXT, 
  p_user_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tokens INT;
  v_current_bid INT;
  v_ends_at TIMESTAMPTZ;
BEGIN
  -- Check user tokens
  SELECT tokens INTO v_user_tokens FROM public.users WHERE id = p_user_id;
  IF v_user_tokens < p_amount THEN
    RAISE EXCEPTION 'Insufficient tokens (Have %, Need %)', v_user_tokens, p_amount;
  END IF;

  -- Lock the auction row
  SELECT current_bid, ends_at INTO v_current_bid, v_ends_at 
  FROM public.auction_items 
  WHERE id = p_auction_id FOR UPDATE;

  IF v_ends_at < NOW() THEN
    RAISE EXCEPTION 'Auction has already ended';
  END IF;

  IF p_amount <= v_current_bid THEN
    RAISE EXCEPTION 'Bid must be higher than %', v_current_bid;
  END IF;

  -- Update the auction
  UPDATE public.auction_items
  SET
    current_bid = p_amount,
    top_bidder = p_username,
    top_bidder_id = p_user_id,
    bidders = bidders || jsonb_build_array(
      jsonb_build_object(
        'username', p_username, 
        'amount', p_amount, 
        'at', NOW()
      )
    )
  WHERE id = p_auction_id;

END;
$$;
