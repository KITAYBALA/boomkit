-- Requires 025 and 026. Deploy with the matching server-authoritative economy UI.
BEGIN;
CREATE TABLE IF NOT EXISTS public.economy_receipts (
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  action text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, request_id)
);
ALTER TABLE public.economy_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.economy_receipts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.economy_receipts TO service_role;

CREATE OR REPLACE FUNCTION public.apply_boomkit_economy_action(p_user_id text, p_request_id uuid, p_action text, p_details jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE u public.users; v_result jsonb; v_action text; v_name text := p_details->>'name';
  v_price numeric := COALESCE((p_details->>'price')::numeric, 0); v_qty numeric; v_amount integer;
  v_today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
BEGIN
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'Request ID required.'; END IF;
  SELECT * INTO u FROM public.users WHERE id=p_user_id FOR UPDATE;
  IF NOT FOUND OR u.status IS DISTINCT FROM 'approved' OR (u.is_banned AND (u.ban_expiry IS NULL OR u.ban_expiry > extract(epoch FROM now())*1000)) THEN RAISE EXCEPTION 'Account unavailable.'; END IF;
  SELECT action, result INTO v_action, v_result FROM public.economy_receipts WHERE user_id=p_user_id AND request_id=p_request_id;
  IF FOUND THEN
    IF v_action IS DISTINCT FROM p_action THEN RAISE EXCEPTION 'Request ID already used for another action.'; END IF;
    RETURN v_result;
  END IF;
  IF v_price::text IN ('NaN','Infinity','-Infinity') OR v_price < 0 OR v_price <> trunc(v_price) THEN RAISE EXCEPTION 'Invalid price.'; END IF;
  IF p_action IN ('open_pack','buy_limited') THEN
    IF v_name IS NULL OR v_price <= 0 OR COALESCE(u.tokens,0) < v_price THEN RAISE EXCEPTION 'Insufficient tokens or invalid item.'; END IF;
    IF p_action = 'open_pack' AND COALESCE((p_details->>'requires_plus')::boolean,false)
      AND NOT (COALESCE(u.is_plus_user,false) OR COALESCE(u.has_plus_pass,false) OR COALESCE(u.plus_reward_expires_at>now(),false) OR u.is_owner OR u.role IN ('owner','admin','senior_moderator','moderator','tester')) THEN RAISE EXCEPTION 'Plus membership required.'; END IF;
    IF p_action='buy_limited' AND COALESCE(u.level,1)<70 AND COALESCE((u.booms->>'The Trophy')::numeric,0)<1 THEN RAISE EXCEPTION 'Reach level 70 to purchase limited items.'; END IF;
    UPDATE public.users SET tokens=COALESCE(tokens,0)-v_price,
      booms=jsonb_set(COALESCE(booms,'{}'),ARRAY[v_name],to_jsonb(COALESCE((booms->>v_name)::numeric,0)+1)),
      boom_score=COALESCE(boom_score,0)+COALESCE((p_details->>'score')::integer,0),
      total_value=COALESCE(total_value,0)+COALESCE((p_details->>'value')::integer,0),
      packs_opened=COALESCE(packs_opened,0)+CASE WHEN p_action='open_pack' THEN 1 ELSE 0 END,
      packs=CASE WHEN p_action='open_pack' AND NOT COALESCE((p_details->>'pack_id')=ANY(packs),false) THEN array_append(COALESCE(packs,ARRAY[]::text[]),p_details->>'pack_id') ELSE packs END
      WHERE id=p_user_id;
    v_result:=jsonb_build_object('success',true,'boom',p_details->'boom','spent',v_price,'name',v_name);
  ELSIF p_action='sell' THEN
    v_qty:=(p_details->>'quantity')::numeric;
    IF v_qty IS NULL OR v_qty::text IN ('NaN','Infinity','-Infinity') OR v_qty<=0 OR v_qty<>trunc(v_qty) OR v_qty>1000000
      OR v_name IS NULL OR COALESCE((u.booms->>v_name)::numeric,0)<v_qty THEN RAISE EXCEPTION 'You do not own this quantity.'; END IF;
    UPDATE public.users SET tokens=COALESCE(tokens,0)+v_price*v_qty,
      booms=CASE WHEN (booms->>v_name)::numeric=v_qty THEN booms-v_name ELSE jsonb_set(booms,ARRAY[v_name],to_jsonb((booms->>v_name)::numeric-v_qty)) END,
      total_value=GREATEST(0,COALESCE(total_value,0)-COALESCE((p_details->>'value')::numeric,0)*v_qty),
      boom_score=GREATEST(0,COALESCE(boom_score,0)-COALESCE((p_details->>'score')::numeric,0)*v_qty),
      pinned_boom=CASE WHEN pinned_boom=v_name AND (booms->>v_name)::numeric=v_qty THEN NULL ELSE pinned_boom END
      WHERE id=p_user_id;
    v_result:=jsonb_build_object('success',true,'earned',v_price*v_qty,'quantity',v_qty);
  ELSIF p_action='spin' THEN
    IF u.last_daily_spin IN (v_today,to_char(now() AT TIME ZONE 'UTC','Dy Mon DD YYYY')) THEN RAISE EXCEPTION 'Already spun today.'; END IF;
    v_amount:=(p_details->>'amount')::integer;
    IF v_amount IS NULL OR v_amount NOT IN (100,150,200,250,300,350,400,500) THEN RAISE EXCEPTION 'Invalid reward.'; END IF;
    UPDATE public.users SET tokens=COALESCE(tokens,0)+v_amount, daily_tokens=COALESCE(daily_tokens,0)+v_amount,last_daily_spin=v_today WHERE id=p_user_id;
    v_result:=jsonb_build_object('success',true,'amount',v_amount);
  ELSE RAISE EXCEPTION 'Unsupported economy action.';
  END IF;
  INSERT INTO public.economy_receipts(user_id,request_id,action,result) VALUES(p_user_id,p_request_id,p_action,v_result);
  RETURN v_result;
END; $$;
REVOKE ALL ON FUNCTION public.apply_boomkit_economy_action(text,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_boomkit_economy_action(text,uuid,text,jsonb) TO service_role;

-- Remove table-wide and any historical column-level SELECT grants first.
REVOKE SELECT ON public.users FROM PUBLIC,anon,authenticated;
DO $$ DECLARE cols text; public_cols text;
BEGIN
  SELECT string_agg(quote_ident(attname),',') INTO cols FROM pg_attribute WHERE attrelid='public.users'::regclass AND attnum>0 AND NOT attisdropped;
  EXECUTE format('REVOKE SELECT (%s) ON public.users FROM PUBLIC,anon,authenticated',cols);
  SELECT string_agg(quote_ident(attname),',') INTO public_cols FROM pg_attribute WHERE attrelid='public.users'::regclass AND attnum>0 AND NOT attisdropped AND attname=ANY(ARRAY[
    'id','username','tokens','packs','booms','role','is_owner','is_banned','is_muted','status','join_date','boom_score','total_value','profile_picture','is_plus_user','name_color','banner_color','badges','last_seen','packs_opened','xp','level','clan_id','clan_role','clan_tag','clan_tag_color','pinned_boom','games_played','correct_answers_count','questions_answered_count']);
  EXECUTE format('GRANT SELECT (%s) ON public.users TO anon,authenticated',public_cols);
END; $$;
COMMIT;
