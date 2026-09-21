-- Apply after 025 with the authenticated RPC gateway. Repeatable.
BEGIN;

CREATE OR REPLACE FUNCTION public.transfer_tokens(p_sender_username text, p_receiver_username text, p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_sender public.users; v_receiver public.users;
BEGIN
  IF p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount <= 0 OR p_amount > 1000000000 OR p_amount <> trunc(p_amount)
    OR p_sender_username IS NOT DISTINCT FROM p_receiver_username THEN RAISE EXCEPTION 'Invalid transfer.'; END IF;
  PERFORM 1 FROM public.users WHERE username IN (p_sender_username, p_receiver_username) ORDER BY id FOR UPDATE;
  SELECT * INTO v_sender FROM public.users WHERE username = p_sender_username;
  SELECT * INTO v_receiver FROM public.users WHERE username = p_receiver_username;
  IF v_sender.id IS NULL OR v_receiver.id IS NULL OR v_sender.is_banned OR v_receiver.is_banned THEN RAISE EXCEPTION 'User unavailable.'; END IF;
  IF COALESCE(v_sender.tokens, 0) < p_amount THEN RAISE EXCEPTION 'Insufficient tokens.'; END IF;
  UPDATE public.users SET tokens = tokens - p_amount WHERE id = v_sender.id;
  UPDATE public.users SET tokens = COALESCE(tokens, 0) + p_amount WHERE id = v_receiver.id;
  RETURN jsonb_build_object('success', true, 'message', 'Tokens transferred.');
END; $$;

CREATE OR REPLACE FUNCTION public.transfer_boom(p_sender_username text, p_receiver_username text, p_boom_name text, p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_sender public.users; v_receiver public.users; v_qty numeric;
BEGIN
  IF p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount <= 0 OR p_amount > 1000000000 OR p_amount <> trunc(p_amount)
    OR p_sender_username IS NOT DISTINCT FROM p_receiver_username OR p_boom_name IS NULL OR length(p_boom_name) NOT BETWEEN 1 AND 128 THEN RAISE EXCEPTION 'Invalid transfer.'; END IF;
  PERFORM 1 FROM public.users WHERE username IN (p_sender_username, p_receiver_username) ORDER BY id FOR UPDATE;
  SELECT * INTO v_sender FROM public.users WHERE username = p_sender_username;
  SELECT * INTO v_receiver FROM public.users WHERE username = p_receiver_username;
  IF v_sender.id IS NULL OR v_receiver.id IS NULL OR v_sender.is_banned OR v_receiver.is_banned THEN RAISE EXCEPTION 'User unavailable.'; END IF;
  v_qty := COALESCE((v_sender.booms->>p_boom_name)::numeric, 0);
  IF v_qty < p_amount THEN RAISE EXCEPTION 'Insufficient boom quantity.'; END IF;
  UPDATE public.users SET booms = CASE WHEN v_qty = p_amount THEN booms - p_boom_name ELSE jsonb_set(booms, ARRAY[p_boom_name], to_jsonb(v_qty - p_amount)) END WHERE id = v_sender.id;
  UPDATE public.users SET booms = jsonb_set(COALESCE(booms, '{}'::jsonb), ARRAY[p_boom_name], to_jsonb(COALESCE((booms->>p_boom_name)::numeric, 0) + p_amount)) WHERE id = v_receiver.id;
  RETURN jsonb_build_object('success', true, 'message', 'Booms transferred.');
END; $$;

-- Historical installations have both void and row-returning versions.
DROP FUNCTION IF EXISTS public.accept_trade(uuid);
CREATE FUNCTION public.accept_trade(trade_uuid uuid)
RETURNS public.trades LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_trade public.trades; v_sender public.users; v_receiver public.users; v_key text; v_qty numeric; v_s jsonb; v_r jsonb;
BEGIN
  SELECT * INTO v_trade FROM public.trades WHERE id = trade_uuid FOR UPDATE;
  IF NOT FOUND OR v_trade.status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Trade is not pending.'; END IF;
  IF v_trade.sender_id IS NOT DISTINCT FROM v_trade.receiver_id THEN RAISE EXCEPTION 'Cannot trade with yourself.'; END IF;
  PERFORM 1 FROM public.users WHERE id IN (v_trade.sender_id, v_trade.receiver_id) ORDER BY id FOR UPDATE;
  SELECT * INTO v_sender FROM public.users WHERE id = v_trade.sender_id;
  SELECT * INTO v_receiver FROM public.users WHERE id = v_trade.receiver_id;
  IF v_sender.id IS NULL OR v_receiver.id IS NULL OR v_sender.is_banned OR v_receiver.is_banned THEN RAISE EXCEPTION 'User unavailable.'; END IF;
  IF v_trade.sender_tokens IS NULL OR v_trade.receiver_tokens IS NULL OR v_trade.sender_tokens::text IN ('NaN','Infinity','-Infinity') OR v_trade.receiver_tokens::text IN ('NaN','Infinity','-Infinity')
    OR v_trade.sender_tokens < 0 OR v_trade.receiver_tokens < 0 OR v_trade.sender_tokens <> trunc(v_trade.sender_tokens) OR v_trade.receiver_tokens <> trunc(v_trade.receiver_tokens)
    OR COALESCE(v_sender.tokens, 0) < v_trade.sender_tokens OR COALESCE(v_receiver.tokens, 0) < v_trade.receiver_tokens THEN RAISE EXCEPTION 'Invalid or insufficient trade tokens.'; END IF;
  IF jsonb_typeof(v_trade.sender_booms) IS DISTINCT FROM 'object' OR jsonb_typeof(v_trade.receiver_booms) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid trade inventory.'; END IF;
  v_s := COALESCE(v_sender.booms, '{}'::jsonb); v_r := COALESCE(v_receiver.booms, '{}'::jsonb);
  -- Validate both original inventories before either party receives anything.
  FOR v_key, v_qty IN SELECT key, value::numeric FROM jsonb_each_text(v_trade.sender_booms) LOOP
    IF v_qty IS NULL OR v_qty::text IN ('NaN','Infinity','-Infinity') OR v_qty <= 0 OR v_qty <> trunc(v_qty) OR COALESCE((v_s->>v_key)::numeric, 0) < v_qty THEN RAISE EXCEPTION 'Invalid sender boom quantity.'; END IF;
  END LOOP;
  FOR v_key, v_qty IN SELECT key, value::numeric FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    IF v_qty IS NULL OR v_qty::text IN ('NaN','Infinity','-Infinity') OR v_qty <= 0 OR v_qty <> trunc(v_qty) OR COALESCE((v_r->>v_key)::numeric, 0) < v_qty THEN RAISE EXCEPTION 'Invalid receiver boom quantity.'; END IF;
  END LOOP;
  FOR v_key, v_qty IN SELECT key, value::numeric FROM jsonb_each_text(v_trade.sender_booms) LOOP
    v_s := jsonb_set(v_s, ARRAY[v_key], to_jsonb((v_s->>v_key)::numeric - v_qty));
    v_r := jsonb_set(v_r, ARRAY[v_key], to_jsonb(COALESCE((v_r->>v_key)::numeric, 0) + v_qty));
  END LOOP;
  FOR v_key, v_qty IN SELECT key, value::numeric FROM jsonb_each_text(v_trade.receiver_booms) LOOP
    v_r := jsonb_set(v_r, ARRAY[v_key], to_jsonb((v_r->>v_key)::numeric - v_qty));
    v_s := jsonb_set(v_s, ARRAY[v_key], to_jsonb(COALESCE((v_s->>v_key)::numeric, 0) + v_qty));
  END LOOP;
  SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb) INTO v_s FROM jsonb_each(v_s) WHERE value::text::numeric > 0;
  SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb) INTO v_r FROM jsonb_each(v_r) WHERE value::text::numeric > 0;
  UPDATE public.users SET booms = v_s, tokens = tokens - v_trade.sender_tokens + v_trade.receiver_tokens WHERE id = v_sender.id;
  UPDATE public.users SET booms = v_r, tokens = tokens - v_trade.receiver_tokens + v_trade.sender_tokens WHERE id = v_receiver.id;
  UPDATE public.trades SET status = 'accepted', updated_at = now() WHERE id = trade_uuid RETURNING * INTO v_trade;
  RETURN v_trade;
END; $$;

ALTER TABLE public.auction_items ADD COLUMN IF NOT EXISTS bid_escrow numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.create_auction(p_boom_name text, p_starting_bid integer, p_duration_hours integer, p_user_id text)
RETURNS public.auction_items LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user public.users; v_qty integer; v_auction public.auction_items;
BEGIN
  IF p_starting_bid IS NULL OR p_starting_bid <= 0 OR p_duration_hours IS NULL OR p_duration_hours NOT BETWEEN 1 AND 168 OR p_boom_name IS NULL THEN RAISE EXCEPTION 'Invalid auction.'; END IF;
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_user.is_banned THEN RAISE EXCEPTION 'User unavailable.'; END IF;
  v_qty := COALESCE((v_user.booms->>p_boom_name)::integer, 0);
  IF v_qty < 1 THEN RAISE EXCEPTION 'You do not own this boom.'; END IF;
  UPDATE public.users SET booms = CASE WHEN v_qty = 1 THEN booms - p_boom_name ELSE jsonb_set(booms, ARRAY[p_boom_name], to_jsonb(v_qty - 1)) END WHERE id = p_user_id;
  INSERT INTO public.auction_items(boom_name, seller, current_bid, ends_at, status)
    VALUES(p_boom_name, v_user.username, p_starting_bid, now() + make_interval(hours => p_duration_hours), 'active') RETURNING * INTO v_auction;
  RETURN v_auction;
END; $$;

DROP FUNCTION IF EXISTS public.place_bid(uuid, integer, text, text);
CREATE FUNCTION public.place_bid(p_auction_id uuid, p_amount integer, p_username text, p_user_id text)
RETURNS public.auction_items LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_auction public.auction_items; v_user public.users; v_refund numeric := 0;
BEGIN
  SELECT * INTO v_auction FROM public.auction_items WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND OR v_auction.status IS DISTINCT FROM 'active' OR v_auction.ends_at <= now() OR p_amount IS NULL OR p_amount <= v_auction.current_bid THEN RAISE EXCEPTION 'Auction ended or bid too low.'; END IF;
  PERFORM 1 FROM public.users WHERE id = p_user_id OR username = v_auction.top_bidder ORDER BY id FOR UPDATE;
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  IF NOT FOUND OR v_user.is_banned OR v_user.username IS DISTINCT FROM p_username OR v_auction.seller = v_user.username THEN RAISE EXCEPTION 'Invalid bidder.'; END IF;
  IF v_auction.top_bidder = v_user.username THEN v_refund := v_auction.bid_escrow; END IF;
  IF COALESCE(v_user.tokens, 0) + v_refund < p_amount THEN RAISE EXCEPTION 'Insufficient tokens.'; END IF;
  IF v_auction.bid_escrow > 0 THEN
    UPDATE public.users SET tokens = COALESCE(tokens, 0) + v_auction.bid_escrow WHERE username = v_auction.top_bidder;
    IF NOT FOUND THEN RAISE EXCEPTION 'Previous bidder unavailable.'; END IF;
  END IF;
  UPDATE public.users SET tokens = tokens - p_amount WHERE id = p_user_id;
  UPDATE public.auction_items SET current_bid = p_amount, top_bidder = v_user.username, bid_escrow = p_amount,
    bidders = COALESCE(bidders, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('username', v_user.username, 'amount', p_amount, 'at', now()))
    WHERE id = p_auction_id RETURNING * INTO v_auction;
  RETURN v_auction;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_auction(p_auction_id uuid, p_user_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_auction public.auction_items; v_user public.users; v_seller_id text;
BEGIN
  SELECT * INTO v_auction FROM public.auction_items WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND OR v_auction.status NOT IN ('active','ended') OR v_auction.ends_at > now() THEN RAISE EXCEPTION 'Auction unavailable or not ended.'; END IF;
  PERFORM 1 FROM public.users WHERE id = p_user_id OR username = v_auction.seller ORDER BY id FOR UPDATE;
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  SELECT id INTO v_seller_id FROM public.users WHERE username = v_auction.seller;
  IF v_user.id IS NULL OR v_seller_id IS NULL OR v_auction.top_bidder IS NULL OR v_user.username IS DISTINCT FROM v_auction.top_bidder OR v_seller_id = p_user_id THEN RAISE EXCEPTION 'You are not the auction winner.'; END IF;
  -- Legacy auctions have no escrow. Only those require a debit at claim time.
  IF v_auction.bid_escrow = 0 THEN
    IF COALESCE(v_user.tokens, 0) < v_auction.current_bid THEN RAISE EXCEPTION 'Insufficient tokens.'; END IF;
    UPDATE public.users SET tokens = tokens - v_auction.current_bid WHERE id = p_user_id;
  ELSIF v_auction.bid_escrow <> v_auction.current_bid THEN RAISE EXCEPTION 'Invalid bid escrow.'; END IF;
  UPDATE public.users SET booms = jsonb_set(COALESCE(booms, '{}'::jsonb), ARRAY[v_auction.boom_name], to_jsonb(COALESCE((booms->>v_auction.boom_name)::integer, 0) + 1)) WHERE id = p_user_id;
  UPDATE public.users SET tokens = COALESCE(tokens, 0) + v_auction.current_bid WHERE id = v_seller_id;
  UPDATE public.auction_items SET status = 'processed', bid_escrow = 0 WHERE id = p_auction_id;
END; $$;

CREATE OR REPLACE FUNCTION public.reclaim_auction_item(p_auction_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_auction public.auction_items;
BEGIN
  SELECT * INTO v_auction FROM public.auction_items WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND OR v_auction.status NOT IN ('active','ended') OR v_auction.ends_at > now() OR v_auction.top_bidder IS NOT NULL OR v_auction.bid_escrow <> 0 THEN RAISE EXCEPTION 'Only ended auctions without bids can be reclaimed.'; END IF;
  UPDATE public.users SET booms = jsonb_set(COALESCE(booms, '{}'::jsonb), ARRAY[v_auction.boom_name], to_jsonb(COALESCE((booms->>v_auction.boom_name)::integer, 0) + 1)) WHERE username = v_auction.seller;
  IF NOT FOUND THEN RAISE EXCEPTION 'Seller unavailable.'; END IF;
  UPDATE public.auction_items SET status = 'processed' WHERE id = p_auction_id;
END; $$;

CREATE OR REPLACE FUNCTION public.set_boomkit_chat_reaction(p_message_id text, p_username text, p_emoji text, p_active boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_reactions jsonb; v_names jsonb;
BEGIN
  IF p_emoji IS NULL OR length(p_emoji) NOT BETWEEN 1 AND 32 OR p_active IS NULL OR p_username IS NULL THEN RAISE EXCEPTION 'Invalid reaction.'; END IF;
  SELECT COALESCE(reactions, '{}'::jsonb) INTO v_reactions FROM public.chat_messages WHERE id::text = p_message_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message not found.'; END IF;
  SELECT COALESCE(jsonb_agg(value), '[]'::jsonb) INTO v_names
    FROM jsonb_array_elements_text(COALESCE(v_reactions->p_emoji, '[]'::jsonb)) WHERE value <> p_username;
  IF p_active THEN v_names := v_names || jsonb_build_array(p_username); END IF;
  v_reactions := CASE WHEN jsonb_array_length(v_names) = 0 THEN v_reactions - p_emoji
    ELSE jsonb_set(v_reactions, ARRAY[p_emoji], v_names) END;
  UPDATE public.chat_messages SET reactions = v_reactions WHERE id::text = p_message_id;
  RETURN v_reactions;
END; $$;

-- The app uses its own HttpOnly session, not Supabase Auth. Browser database
-- roles may not call privileged functions, even through PostgreSQL's PUBLIC role.
DO $$ DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND (p.prosecdef OR p.proname IN ('place_bid','update_game_score','log_user_activity'))
      AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.objid=p.oid AND d.classid='pg_proc'::regclass AND d.deptype='e')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.signature);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f.signature);
  END LOOP;
END; $$;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.users, public.auction_items, public.trades, public.active_boosts, public.chat_messages FROM anon, authenticated;
REVOKE ALL ON public.direct_messages, public.conversation_members, public.conversations FROM anon, authenticated;
REVOKE SELECT ON public.trades FROM anon, authenticated;
GRANT ALL ON public.users, public.auction_items, public.trades, public.active_boosts, public.chat_messages, public.direct_messages, public.conversation_members, public.conversations TO service_role;
COMMIT;
