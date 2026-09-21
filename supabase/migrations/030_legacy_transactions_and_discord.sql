BEGIN;
CREATE OR REPLACE FUNCTION public.valid_boomkit_inventory(items jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE item record; quantity numeric;
BEGIN
 IF items IS NULL OR jsonb_typeof(items)<>'object' THEN RETURN false; END IF;
 FOR item IN SELECT * FROM jsonb_each(items) LOOP
   IF length(item.key) NOT BETWEEN 1 AND 128 OR jsonb_typeof(item.value)<>'number' THEN RETURN false; END IF;
   quantity:=item.value::text::numeric;
   IF quantity<0 OR quantity>1000000000 OR quantity<>trunc(quantity) THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.valid_boomkit_inventory(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.valid_boomkit_inventory(jsonb) TO service_role;
-- NOT VALID preserves old rows for explicit repair; every new/updated row is checked.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname='users_nonnegative_tokens') THEN
  ALTER TABLE public.users ADD CONSTRAINT users_nonnegative_tokens CHECK(tokens>=0) NOT VALID;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname='users_valid_inventory') THEN
  ALTER TABLE public.users ADD CONSTRAINT users_valid_inventory CHECK(public.valid_boomkit_inventory(booms)) NOT VALID;
 END IF;
END; $$;

-- Preserve installed feature implementations while placing locks BEFORE their reads.
-- All legacy calls share an advisory lock; modern wallet operations use user row locks.
DO $$ DECLARE f record; arg_names text; user_args text; actor text; extra text; invocation text; legacy text;
BEGIN
 FOR f IN SELECT p.*,pg_get_function_arguments(p.oid) AS declarations,pg_get_function_identity_arguments(p.oid) AS identity_args,pg_get_function_result(p.oid) AS result_type
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname=ANY(ARRAY[
 'send_friend_request','accept_friend_request','remove_friend','craft_boom','claim_daily_streak','buy_shop_item','fuse_booms','claim_fusion_result',
 'create_clan','join_clan','leave_clan','donate_to_clan','kick_from_clan','transfer_clan_leadership','update_clan_member_role','update_clan_info','buy_clan_upgrade',
 'join_tournament_clan','finalize_tournament','start_new_season','list_boom_rental','rent_boom','cancel_rental']) LOOP
  legacy:='locked_legacy_'||f.proname;
  IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.pronamespace=f.pronamespace AND p.proname=legacy AND p.proargtypes=f.proargtypes) THEN
   EXECUTE format('ALTER FUNCTION public.%I(%s) RENAME TO %I',f.proname,f.identity_args,legacy);
  END IF;
  SELECT string_agg(quote_ident(a),',') INTO arg_names FROM unnest(f.proargnames) a;
  SELECT string_agg(quote_ident(a)||'::text',',') INTO user_args FROM unnest(f.proargnames) a WHERE a=ANY(ARRAY['p_username','p_player_username','p_owner','p_renter','p_from','p_to','p_friend','p_target_username']);
  actor:=NULL;
  SELECT a INTO actor FROM unnest(ARRAY['p_username','p_player_username','p_owner','p_renter','p_from']) a WHERE a=ANY(f.proargnames) LIMIT 1;
  extra:='';
  IF user_args IS NOT NULL THEN
   extra:=extra||format('PERFORM 1 FROM public.users WHERE username=ANY(ARRAY[%s]) ORDER BY id FOR UPDATE;',user_args);
   extra:=extra||format('IF to_regclass(''public.clans'') IS NOT NULL THEN PERFORM 1 FROM public.clans WHERE id IN (SELECT clan_id FROM public.users WHERE username=ANY(ARRAY[%s])) ORDER BY id FOR UPDATE; END IF;',user_args);
  END IF;
  IF actor IS NOT NULL THEN extra:=extra||format('IF NOT EXISTS(SELECT 1 FROM public.users WHERE username=%I AND status=''approved'' AND (NOT is_banned OR ban_expiry<=extract(epoch FROM clock_timestamp())*1000)) THEN RAISE EXCEPTION ''Account unavailable.''; END IF;',actor); END IF;
  IF 'p_clan_id'=ANY(f.proargnames) THEN extra:=extra||'PERFORM 1 FROM public.clans WHERE id=p_clan_id FOR UPDATE;'; END IF;
  invocation:=CASE WHEN f.result_type='void' THEN format('PERFORM public.%I(%s); RETURN;',legacy,arg_names) ELSE format('RETURN public.%I(%s);',legacy,arg_names) END;
  EXECUTE format('CREATE OR REPLACE FUNCTION public.%I(%s) RETURNS %s LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $wrapped$ BEGIN PERFORM pg_advisory_xact_lock(732091); %s %s END; $wrapped$',f.proname,f.declarations,f.result_type,extra,invocation);
  EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC,anon,authenticated',f.proname,f.identity_args);
  EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC,anon,authenticated',legacy,f.identity_args);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role',f.proname,f.identity_args);
 END LOOP;
END; $$;

CREATE TABLE IF NOT EXISTS public.discord_wallet_receipts(event_id text PRIMARY KEY,user_id text NOT NULL,action text NOT NULL,result jsonb NOT NULL,created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.discord_wallet_cooldowns(user_id text NOT NULL,action text NOT NULL,available_at timestamptz NOT NULL,PRIMARY KEY(user_id,action));
ALTER TABLE public.discord_wallet_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_wallet_cooldowns ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.discord_wallet_action(p_discord_id text,p_event_id text,p_action text,p_amount integer DEFAULT 0,p_win boolean DEFAULT false,p_code text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_username text; u public.users; prior public.discord_wallet_receipts; reward integer; balance integer; result jsonb; promo record;
BEGIN
 IF (SELECT count(DISTINCT k.used_by_username) FROM public.access_keys k WHERE k.discord_user_id=p_discord_id AND k.is_used=true)<>1 THEN RAISE EXCEPTION 'Link exactly one Boomkit account first.'; END IF;
 SELECT k.used_by_username INTO v_username FROM public.access_keys k WHERE k.discord_user_id=p_discord_id AND k.is_used=true;
 IF v_username IS NULL THEN RAISE EXCEPTION 'Link your Boomkit account first.'; END IF;
 SELECT * INTO u FROM public.users WHERE users.username=v_username FOR UPDATE;
 IF NOT FOUND OR u.status<>'approved' OR (u.is_banned AND (u.ban_expiry IS NULL OR u.ban_expiry>extract(epoch FROM clock_timestamp())*1000)) THEN RAISE EXCEPTION 'Account unavailable.'; END IF;
 SELECT * INTO prior FROM public.discord_wallet_receipts WHERE event_id=p_event_id;
 IF FOUND THEN
   IF prior.user_id<>u.id OR prior.action<>p_action THEN RAISE EXCEPTION 'Event already settled.'; END IF;
   RETURN prior.result;
 END IF;
 IF p_action IN ('coinflip','daily') THEN
  IF EXISTS(SELECT 1 FROM public.discord_wallet_cooldowns WHERE user_id=u.id AND action=p_action AND available_at>clock_timestamp()) THEN RAISE EXCEPTION 'Reward cooldown is active.'; END IF;
 END IF;
 IF p_action='coinflip' THEN
   IF p_amount IS NULL OR p_amount NOT BETWEEN 100 AND 10000 OR u.tokens<p_amount OR p_win IS NULL THEN RAISE EXCEPTION 'Invalid wager or insufficient balance.'; END IF;
   reward:=CASE WHEN p_win THEN p_amount ELSE -p_amount END;
   INSERT INTO public.discord_wallet_cooldowns VALUES(u.id,p_action,clock_timestamp()+interval '1 hour') ON CONFLICT(user_id,action) DO UPDATE SET available_at=excluded.available_at;
 ELSIF p_action='daily' THEN
   IF u.last_daily_spin IN (to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD'),to_char(clock_timestamp() AT TIME ZONE 'UTC','Dy Mon DD YYYY')) THEN RAISE EXCEPTION 'Already claimed today.'; END IF;
   reward:=50;
   UPDATE public.users SET last_daily_spin=to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD') WHERE id=u.id;
 ELSIF p_action='trivia' THEN
   PERFORM public.enforce_action_limit('discord-trivia:'||u.id,20,3600);
   reward:=100;
 ELSIF p_action='promo' THEN
   SELECT * INTO promo FROM public.promo_codes WHERE code=p_code FOR UPDATE;
   IF NOT FOUND OR promo.tokens_reward<=0 OR promo.current_uses>=promo.max_uses OR promo.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Code unavailable.'; END IF;
   IF EXISTS(SELECT 1 FROM public.promo_redemptions WHERE code=p_code AND promo_redemptions.username=u.username) THEN RAISE EXCEPTION 'Code already redeemed.'; END IF;
   INSERT INTO public.promo_redemptions(code,username) VALUES(p_code,u.username);
   UPDATE public.promo_codes SET current_uses=current_uses+1 WHERE code=p_code;
   reward:=promo.tokens_reward;
 ELSE RAISE EXCEPTION 'Unsupported wallet action.';
 END IF;
 UPDATE public.users SET tokens=tokens+reward WHERE id=u.id RETURNING tokens INTO balance;
 result:=jsonb_build_object('balance',balance,'reward',reward,'username',u.username,'win',p_win);
 INSERT INTO public.discord_wallet_receipts VALUES(p_event_id,u.id,p_action,result,clock_timestamp());
 RETURN result;
END; $$;
REVOKE ALL ON public.discord_wallet_receipts,public.discord_wallet_cooldowns FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.discord_wallet_receipts,public.discord_wallet_cooldowns TO service_role;
REVOKE ALL ON FUNCTION public.discord_wallet_action(text,text,text,integer,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.discord_wallet_action(text,text,text,integer,boolean,text) TO service_role;
COMMIT;
