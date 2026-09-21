-- Requires 025-028 and the existing application tables. Do not replay older migrations afterward.
BEGIN;
REVOKE CREATE ON SCHEMA public FROM PUBLIC,anon,authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC,anon,authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated;
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS mode text DEFAULT 'classic';
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';
ALTER TABLE public.verified_game_runs ADD COLUMN IF NOT EXISTS session_pin text;

CREATE TABLE IF NOT EXISTS public.action_limits (key text PRIMARY KEY, count integer NOT NULL, resets_at timestamptz NOT NULL);
ALTER TABLE public.action_limits ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.enforce_action_limit(p_key text,p_limit integer,p_seconds integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_count integer;
BEGIN
 INSERT INTO public.action_limits(key,count,resets_at) VALUES(p_key,1,clock_timestamp()+make_interval(secs=>p_seconds))
 ON CONFLICT(key) DO UPDATE SET count=CASE WHEN action_limits.resets_at<=clock_timestamp() THEN 1 ELSE action_limits.count+1 END,
 resets_at=CASE WHEN action_limits.resets_at<=clock_timestamp() THEN clock_timestamp()+make_interval(secs=>p_seconds) ELSE action_limits.resets_at END RETURNING count INTO v_count;
 IF v_count>p_limit THEN RAISE EXCEPTION 'Too many requests. Please wait and try again.'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.secure_game_session(p_user_id text,p_pin text,p_action text,p_details jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u public.users; s public.game_sessions; player jsonb; v_duration integer;
BEGIN
 SELECT * INTO u FROM public.users WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND OR u.status<>'approved' OR (u.is_banned AND (u.ban_expiry IS NULL OR u.ban_expiry>extract(epoch FROM clock_timestamp())*1000)) THEN RAISE EXCEPTION 'Account unavailable.'; END IF;
 IF p_pin !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'Invalid room code.'; END IF;
 player:=jsonb_build_object('id',u.id,'username',u.username,'profilePicture',u.profile_picture,'score',0,'accuracy',0);
 IF p_action='create' THEN
   PERFORM public.enforce_action_limit('room-create:'||u.id,3,60);
   INSERT INTO public.game_sessions(pin,host_id,host_username,grade,subject,questions,status,duration,players,mode,settings)
   VALUES(p_pin,u.id,u.username,(p_details->>'grade')::integer,p_details->>'subject',p_details->'questions','waiting',(p_details->>'duration')::integer,jsonb_build_array(player),p_details->>'mode',COALESCE(p_details->'settings','{}')) RETURNING * INTO s;
   RETURN to_jsonb(s);
 END IF;
 PERFORM public.enforce_action_limit('room-'||p_action||':'||u.id,CASE WHEN p_action='read' THEN 120 ELSE 20 END,60);
 SELECT * INTO s FROM public.game_sessions WHERE pin=p_pin FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Room not found.'; END IF;
 IF p_action='join' THEN
   IF s.status='finished' OR s.created_at<clock_timestamp()-interval '2 hours' THEN RAISE EXCEPTION 'Room has ended.'; END IF;
   IF s.status LIKE 'started:%' AND to_timestamp(split_part(s.status,':',2)::numeric/1000)+make_interval(secs=>s.duration)<=clock_timestamp() THEN RAISE EXCEPTION 'Room has ended.'; END IF;
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(s.players,'[]')) p WHERE p->>'id'=u.id) THEN
     IF jsonb_array_length(COALESCE(s.players,'[]'))>=100 THEN RAISE EXCEPTION 'Room is full.'; END IF;
     UPDATE public.game_sessions SET players=COALESCE(players,'[]')||jsonb_build_array(player) WHERE pin=p_pin RETURNING * INTO s;
   END IF;
 ELSIF p_action='read' THEN
   IF s.host_id<>u.id AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(s.players,'[]')) p WHERE p->>'id'=u.id) THEN RAISE EXCEPTION 'Join this room first.'; END IF;
 ELSIF p_action IN ('start','finish') THEN
   IF s.host_id<>u.id THEN RAISE EXCEPTION 'Only the host can control this room.'; END IF;
   IF p_action='start' THEN
     IF s.status<>'waiting' THEN RETURN to_jsonb(s); END IF;
     IF s.created_at<clock_timestamp()-interval '2 hours' THEN RAISE EXCEPTION 'Room has ended.'; END IF;
     v_duration:=(p_details->>'duration')::integer;
     IF v_duration IS NULL OR v_duration NOT BETWEEN 10 AND 3600 THEN RAISE EXCEPTION 'Invalid duration.'; END IF;
     UPDATE public.game_sessions SET status='started:'||floor(extract(epoch FROM clock_timestamp())*1000)::bigint,duration=v_duration WHERE pin=p_pin RETURNING * INTO s;
   ELSE
     UPDATE public.game_sessions SET status='finished' WHERE pin=p_pin RETURNING * INTO s;
   END IF;
 ELSE RAISE EXCEPTION 'Unsupported room action.';
 END IF;
 RETURN to_jsonb(s);
END; $$;

DO $$ BEGIN
 IF to_regprocedure('public.apply_boomkit_game_action_v1(text,uuid,text,jsonb)') IS NULL THEN
   ALTER FUNCTION public.apply_boomkit_game_action(text,uuid,text,jsonb) RENAME TO apply_boomkit_game_action_v1;
 END IF;
END; $$;
CREATE OR REPLACE FUNCTION public.apply_boomkit_game_action(p_user_id text,p_run_id uuid,p_action text,p_details jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE s public.game_sessions; r public.verified_game_runs; result jsonb; v_pin text; deadline timestamptz;
BEGIN
 PERFORM 1 FROM public.users WHERE id=p_user_id FOR UPDATE;
 IF p_action='start' THEN
   v_pin:=p_details->>'session_pin';
   SELECT * INTO r FROM public.verified_game_runs WHERE id=p_run_id AND user_id=p_user_id;
   IF FOUND AND r.session_pin IS DISTINCT FROM v_pin THEN RAISE EXCEPTION 'Game run belongs to a different session.'; END IF;
   IF v_pin IS NOT NULL THEN
     SELECT * INTO s FROM public.game_sessions WHERE game_sessions.pin=v_pin FOR UPDATE;
     IF NOT FOUND OR s.status NOT LIKE 'started:%' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(s.players) p WHERE p->>'id'=p_user_id) THEN RAISE EXCEPTION 'No active joined room.'; END IF;
     IF EXISTS(SELECT 1 FROM public.verified_game_runs WHERE user_id=p_user_id AND session_pin=v_pin AND id<>p_run_id) THEN RAISE EXCEPTION 'This room already has a run for your account.'; END IF;
     deadline:=to_timestamp(split_part(s.status,':',2)::numeric/1000)+make_interval(secs=>s.duration);
     IF deadline<=clock_timestamp() THEN RAISE EXCEPTION 'Room has ended.'; END IF;
   END IF;
 END IF;
 IF p_action='answer' THEN
   SELECT * INTO r FROM public.verified_game_runs WHERE id=p_run_id AND user_id=p_user_id;
   IF r.session_pin IS NOT NULL THEN
     SELECT * INTO s FROM public.game_sessions WHERE game_sessions.pin=r.session_pin FOR UPDATE;
     IF s.status NOT LIKE 'started:%' THEN RAISE EXCEPTION 'Room has ended.'; END IF;
   END IF;
 END IF;
 result:=public.apply_boomkit_game_action_v1(p_user_id,p_run_id,p_action,p_details);
 IF p_action='start' AND v_pin IS NOT NULL THEN
   UPDATE public.verified_game_runs SET session_pin=v_pin,ends_at=LEAST(ends_at,deadline) WHERE id=p_run_id AND user_id=p_user_id;
 END IF;
 IF p_action IN ('answer','finish') THEN
   SELECT * INTO r FROM public.verified_game_runs WHERE id=p_run_id AND user_id=p_user_id;
   IF r.session_pin IS NOT NULL THEN
     UPDATE public.game_sessions SET players=(SELECT jsonb_agg(CASE WHEN p->>'id'=p_user_id THEN p||jsonb_build_object('score',r.correct_count*10,'accuracy',CASE WHEN jsonb_array_length(r.answers)>0 THEN least(100,round(100.0*r.correct_count/jsonb_array_length(r.answers))) ELSE 0 END) ELSE p END) FROM jsonb_array_elements(players) p) WHERE game_sessions.pin=r.session_pin;
   END IF;
 END IF;
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.secure_clan_chat(p_user_id text,p_clan_id uuid,p_message text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u public.users; result jsonb;
BEGIN
 SELECT * INTO u FROM public.users WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND OR u.status<>'approved' OR u.is_banned OR u.clan_id IS NULL OR (p_clan_id IS NOT NULL AND u.clan_id<>p_clan_id) THEN RAISE EXCEPTION 'Clan membership required.'; END IF;
 IF p_message IS NOT NULL THEN
   IF u.is_muted AND (u.mute_expiry IS NULL OR u.mute_expiry>extract(epoch FROM clock_timestamp())*1000) THEN RAISE EXCEPTION 'You are muted.'; END IF;
   IF length(trim(p_message)) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Invalid message.'; END IF;
   INSERT INTO public.clan_chat_messages(clan_id,username,message) VALUES(u.clan_id,u.username,trim(p_message));
 END IF;
 SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY created_at),'[]') INTO result FROM (SELECT * FROM public.clan_chat_messages WHERE clan_id=u.clan_id ORDER BY created_at DESC LIMIT 50) m;
 RETURN result;
END; $$;

-- Deny browser mutations across application tables, including historical column ACLs.
DO $$ DECLARE t record; cols text; private_cols text; f record;
BEGIN
 FOR t IN SELECT c.oid,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.objid=c.oid AND d.classid='pg_class'::regclass AND d.deptype='e') LOOP
   EXECUTE format('REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.%I FROM PUBLIC,anon,authenticated',t.relname);
   SELECT string_agg(quote_ident(attname),',') INTO cols FROM pg_attribute WHERE attrelid=t.oid AND attnum>0 AND NOT attisdropped;
   EXECUTE format('REVOKE INSERT (%s),UPDATE (%s),REFERENCES (%s) ON public.%I FROM PUBLIC,anon,authenticated',cols,cols,cols,t.relname);
   EXECUTE format('GRANT ALL ON public.%I TO service_role',t.relname);
 END LOOP;
 FOREACH cols IN ARRAY ARRAY['game_sessions','custom_sets','clan_chat_messages','friends','user_activity','claimed_season_rewards','access_keys','user_secrets','blacklisted_ips','promo_codes','promo_redemptions','action_limits','rate_limits','payment_receipts','purchase_receipts','verified_game_runs','economy_receipts'] LOOP
   IF to_regclass('public.'||cols) IS NOT NULL THEN
     EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',cols);
     SELECT string_agg(quote_ident(attname),',') INTO private_cols FROM pg_attribute WHERE attrelid=to_regclass('public.'||cols) AND attnum>0 AND NOT attisdropped;
     EXECUTE format('REVOKE SELECT (%s) ON public.%I FROM PUBLIC,anon,authenticated',private_cols,cols);
   END IF;
 END LOOP;
 FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('v','m') AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.objid=c.oid AND d.classid='pg_class'::regclass AND d.deptype='e') LOOP
   EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t.relname);
   SELECT string_agg(quote_ident(attname),',') INTO private_cols FROM pg_attribute WHERE attrelid=to_regclass('public.'||t.relname) AND attnum>0 AND NOT attisdropped;
   EXECUTE format('REVOKE SELECT (%s) ON public.%I FROM PUBLIC,anon,authenticated',private_cols,t.relname);
 END LOOP;
 FOREACH cols IN ARRAY ARRAY['clans','boom_rentals','tournaments','tournament_clans','tournament_participants','user_boom_evolution','achievements','user_achievements','seasons','season_rewards','shop_items','craft_recipes','question_bank'] LOOP
   IF to_regclass('public.'||cols) IS NOT NULL THEN
     EXECUTE format('GRANT SELECT ON public.%I TO anon,authenticated',cols);
     EXECUTE format('DROP POLICY IF EXISTS boomkit_public_catalog ON public.%I',cols);
     EXECUTE format('CREATE POLICY boomkit_public_catalog ON public.%I FOR SELECT TO anon,authenticated USING(true)',cols);
   END IF;
 END LOOP;
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.objid=p.oid AND d.classid='pg_proc'::regclass AND d.deptype='e') LOOP
   EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
   EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END; $$;
COMMIT;
