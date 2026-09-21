-- Apply after 024. Repeatable; no user data is deleted. Deploy with the matching API changes.
BEGIN;

ALTER TABLE public.user_secrets ADD COLUMN IF NOT EXISTS sessions_revoked_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plus_reward_expires_at timestamptz;

-- Abort rather than silently merge existing accounts with conflicting identities.
CREATE UNIQUE INDEX IF NOT EXISTS users_username_case_unique ON public.users (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_case_unique ON public.users (lower(email)) WHERE email IS NOT NULL AND email <> '';

CREATE OR REPLACE FUNCTION public.consume_auth_attempt(p_key text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_count integer; v_reset timestamptz; v_now timestamptz := clock_timestamp();
BEGIN
  IF p_key IS NULL OR length(p_key) > 128 THEN RAISE EXCEPTION 'Invalid rate limit key'; END IF;
  INSERT INTO public.rate_limits(ip, count, reset_time) VALUES(p_key, 0, v_now + interval '1 minute') ON CONFLICT DO NOTHING;
  SELECT count, reset_time INTO v_count, v_reset FROM public.rate_limits WHERE ip = p_key FOR UPDATE;
  IF v_reset <= v_now THEN v_count := 0; v_reset := v_now + interval '1 minute'; END IF;
  v_count := v_count + 1;
  IF v_count = 6 THEN v_reset := v_now + interval '5 minutes'; END IF;
  UPDATE public.rate_limits SET count = LEAST(v_count, 7), reset_time = v_reset WHERE ip = p_key;
  RETURN jsonb_build_object('allowed', v_count <= 5, 'retry_after', GREATEST(1, ceil(extract(epoch FROM v_reset - v_now))));
END; $$;

CREATE OR REPLACE FUNCTION public.register_boomkit_user(
  p_username text, p_email text, p_age integer, p_reason text, p_access_key text,
  p_password_hash text, p_ip text, p_device text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user public.users; v_used boolean;
BEGIN
  IF p_username IS NULL OR p_username !~ '^[A-Za-z0-9_]{3,20}$' OR p_age IS NULL OR p_age < 10 OR p_age > 120 THEN
    RAISE EXCEPTION 'Invalid registration details.';
  END IF;
  IF p_password_hash IS NULL OR p_password_hash !~ '^scrypt\$16384\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$' THEN
    RAISE EXCEPTION 'Invalid password hash.';
  END IF;
  SELECT is_used INTO v_used FROM public.access_keys WHERE key = p_access_key FOR UPDATE;
  IF NOT FOUND OR v_used IS DISTINCT FROM false THEN RAISE EXCEPTION 'Access key is invalid or already used.'; END IF;
  INSERT INTO public.users(id, username, email, age, reason, status, join_date, role, tokens,
    daily_tokens, boom_score, total_value, is_owner, is_banned, is_muted, is_plus_user,
    profile_picture, name_color, banner_color, last_daily_spin, last_seen, packs_opened)
  VALUES(gen_random_uuid()::text, p_username, COALESCE(NULLIF(p_email, ''), gen_random_uuid()::text || '@boomkit.local'),
    p_age, left(COALESCE(p_reason, ''), 1000), 'pending', to_char(current_date, 'YYYY-MM-DD'), 'player',
    0, 0, 0, 0, false, false, false, false,
    '', '', '', '', floor(extract(epoch FROM clock_timestamp()) * 1000), 0)
  RETURNING * INTO v_user;
  INSERT INTO public.user_secrets(user_id, password_hash, last_ip, mac_address, password_reset_required)
  VALUES(v_user.id, p_password_hash, p_ip, p_device, false);
  UPDATE public.access_keys SET is_used = true, used_by_username = p_username WHERE key = p_access_key;
  RETURN to_jsonb(v_user);
END; $$;

CREATE TABLE IF NOT EXISTS public.payment_receipts (
  event_key text PRIMARY KEY,
  user_id text NOT NULL REFERENCES public.users(id),
  product_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.fulfill_boomkit_purchase(
  p_event_key text, p_user_id text, p_product_id text, p_tokens integer, p_booster text, p_plus boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user public.users; v_inventory jsonb; v_index integer; v_receipt public.payment_receipts;
BEGIN
  IF p_event_key IS NULL OR length(p_event_key) > 200 OR p_tokens IS NULL OR p_tokens < 0 OR p_tokens > 100000 THEN
    RAISE EXCEPTION 'Invalid purchase';
  END IF;
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  INSERT INTO public.payment_receipts(event_key, user_id, product_id) VALUES(p_event_key, p_user_id, p_product_id) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN
    SELECT * INTO v_receipt FROM public.payment_receipts WHERE event_key = p_event_key;
    IF v_receipt.user_id <> p_user_id OR v_receipt.product_id <> p_product_id THEN RAISE EXCEPTION 'Receipt conflict'; END IF;
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;
  v_inventory := COALESCE(v_user.inventory, '[]'::jsonb);
  IF p_booster IS NOT NULL THEN
    SELECT ordinality::integer - 1 INTO v_index FROM jsonb_array_elements(v_inventory) WITH ORDINALITY WHERE value->>'id' = p_booster LIMIT 1;
    IF v_index IS NULL THEN v_inventory := v_inventory || jsonb_build_array(jsonb_build_object('id', p_booster, 'quantity', 1));
    ELSE v_inventory := jsonb_set(v_inventory, ARRAY[v_index::text, 'quantity'], to_jsonb(COALESCE((v_inventory->v_index->>'quantity')::integer, 0) + 1)); END IF;
  END IF;
  UPDATE public.users SET tokens = COALESCE(tokens, 0) + p_tokens, inventory = v_inventory,
    is_plus_user = COALESCE(is_plus_user, false) OR p_plus, has_plus_pass = COALESCE(has_plus_pass, false) OR p_plus WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'duplicate', false);
END; $$;

CREATE OR REPLACE FUNCTION public.activate_boomkit_boost(p_user_id text, p_booster_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user public.users; v_inventory jsonb; v_index integer; v_quantity integer; v_hours integer; v_multiplier integer;
BEGIN
  CASE p_booster_id
    WHEN 'luck-charm-2x-1h' THEN v_hours := 1; v_multiplier := 2;
    WHEN 'luck-charm-2x-2h' THEN v_hours := 2; v_multiplier := 2;
    WHEN 'luck-charm-2x-3h' THEN v_hours := 3; v_multiplier := 2;
    WHEN 'luck-charm-super-3x-1h' THEN v_hours := 1; v_multiplier := 3;
    ELSE RAISE EXCEPTION 'Invalid booster.';
  END CASE;
  -- Serialize the singleton global boost, including when no row exists yet.
  PERFORM pg_advisory_xact_lock(25001);
  IF EXISTS(SELECT 1 FROM public.active_boosts WHERE ends_at > now()) THEN RAISE EXCEPTION 'Another global booster is active.'; END IF;
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_user.is_banned THEN RAISE EXCEPTION 'User unavailable.'; END IF;
  v_inventory := COALESCE(v_user.inventory, '[]'::jsonb);
  SELECT ordinality::integer - 1 INTO v_index FROM jsonb_array_elements(v_inventory) WITH ORDINALITY WHERE value->>'id' = p_booster_id LIMIT 1;
  v_quantity := COALESCE((v_inventory->v_index->>'quantity')::integer, 0);
  IF v_quantity < 1 THEN RAISE EXCEPTION 'You do not own this booster.'; END IF;
  IF v_quantity = 1 THEN v_inventory := v_inventory - v_index;
  ELSE v_inventory := jsonb_set(v_inventory, ARRAY[v_index::text, 'quantity'], to_jsonb(v_quantity - 1)); END IF;
  UPDATE public.users SET inventory = v_inventory WHERE id = p_user_id;
  INSERT INTO public.active_boosts(activated_by, multiplier, duration_hours, ends_at)
    VALUES(v_user.username, v_multiplier, v_hours, now() + make_interval(hours => v_hours));
  RETURN jsonb_build_object('success', true, 'message', 'Global booster activated.', 'inventory', v_inventory);
END; $$;

CREATE OR REPLACE FUNCTION public.claim_boomkit_season_reward(p_user_id text, p_reward_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user public.users; v_reward public.season_rewards; v_value integer;
BEGIN
  SELECT r.* INTO v_reward FROM public.season_rewards r JOIN public.seasons s ON s.id = r.season_id
    WHERE r.id = p_reward_id AND s.is_active AND s.start_date <= now() AND s.end_date > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'This reward is not in an active season.'; END IF;
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_user.is_banned THEN RAISE EXCEPTION 'User unavailable.'; END IF;
  IF COALESCE(v_user.season_xp, 0) < v_reward.xp_required THEN RAISE EXCEPTION 'Insufficient season XP.'; END IF;
  IF v_reward.is_premium AND NOT (COALESCE(v_user.has_plus_pass, false) OR COALESCE(v_user.is_plus_user, false)
    OR COALESCE(v_user.plus_reward_expires_at > now(), false) OR COALESCE(v_user.is_owner, false)
    OR v_user.role IN ('owner', 'admin', 'senior_moderator', 'moderator', 'tester')) THEN RAISE EXCEPTION 'Plus Pass is required.'; END IF;
  INSERT INTO public.claimed_season_rewards(user_id, reward_id) VALUES(p_user_id, p_reward_id) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reward already claimed.'; END IF;
  CASE v_reward.reward_type
    WHEN 'tokens' THEN
      v_value := v_reward.reward_value::integer;
      IF v_value <= 0 THEN RAISE EXCEPTION 'Invalid reward amount.'; END IF;
      UPDATE public.users SET tokens = COALESCE(tokens, 0) + v_value WHERE id = p_user_id;
    WHEN 'boom' THEN
      IF COALESCE(v_reward.reward_value, '') = '' THEN RAISE EXCEPTION 'Invalid boom reward.'; END IF;
      UPDATE public.users SET booms = jsonb_set(COALESCE(booms, '{}'::jsonb), ARRAY[v_reward.reward_value],
        to_jsonb(COALESCE((booms->>v_reward.reward_value)::integer, 0) + 1)) WHERE id = p_user_id;
    WHEN 'plus_days' THEN
      v_value := v_reward.reward_value::integer;
      IF v_value < 1 OR v_value > 365 THEN RAISE EXCEPTION 'Invalid Plus duration.'; END IF;
      UPDATE public.users SET plus_reward_expires_at = GREATEST(COALESCE(plus_reward_expires_at, now()), now()) + make_interval(days => v_value) WHERE id = p_user_id;
    ELSE RAISE EXCEPTION 'Unsupported reward type.';
  END CASE;
  RETURN jsonb_build_object('success', true, 'message', 'Season reward claimed.');
END; $$;

REVOKE ALL ON TABLE public.payment_receipts, public.user_secrets, public.rate_limits, public.claimed_season_rewards FROM anon, authenticated;
GRANT ALL ON TABLE public.payment_receipts, public.user_secrets, public.rate_limits, public.claimed_season_rewards TO service_role;
-- PUBLIC has EXECUTE by default: revoking anon alone is insufficient.
REVOKE ALL ON FUNCTION public.consume_auth_attempt(text), public.register_boomkit_user(text,text,integer,text,text,text,text,text),
  public.fulfill_boomkit_purchase(text,text,text,integer,text,boolean), public.activate_boomkit_boost(text,text),
  public.claim_boomkit_season_reward(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_auth_attempt(text), public.register_boomkit_user(text,text,integer,text,text,text,text,text),
  public.fulfill_boomkit_purchase(text,text,text,integer,text,boolean), public.activate_boomkit_boost(text,text),
  public.claim_boomkit_season_reward(text,uuid) TO service_role;
COMMIT;
