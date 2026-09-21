-- Requires 027. Browser scores never determine account rewards.
BEGIN;
CREATE TABLE IF NOT EXISTS public.verified_game_runs (
  id uuid PRIMARY KEY, user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  questions jsonb NOT NULL, answers jsonb NOT NULL DEFAULT '[]',
  rewarded_keys text[] NOT NULL DEFAULT '{}', correct_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT clock_timestamp(), ends_at timestamptz NOT NULL,
  last_answer_at timestamptz, finished_at timestamptz, result jsonb
);
CREATE INDEX IF NOT EXISTS verified_game_runs_user_started ON public.verified_game_runs(user_id,started_at DESC);
ALTER TABLE public.verified_game_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.verified_game_runs FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.verified_game_runs TO service_role;

CREATE OR REPLACE FUNCTION public.apply_boomkit_game_action(p_user_id text,p_run_id uuid,p_action text,p_details jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u public.users; r public.verified_game_runs; q jsonb; pos integer; choice integer;
  earned integer; gained integer; remaining_xp integer; new_level integer; v_result jsonb; duration integer;
  milestone jsonb; new_booms jsonb; v_clan uuid; evolution_xp integer; evolution_level integer;
BEGIN
  -- All game/economy functions lock the user first, then the run.
  SELECT * INTO u FROM public.users WHERE id=p_user_id FOR UPDATE;
  IF NOT FOUND OR u.status IS DISTINCT FROM 'approved' OR (u.is_banned AND (u.ban_expiry IS NULL OR u.ban_expiry>extract(epoch FROM clock_timestamp())*1000)) THEN RAISE EXCEPTION 'Account unavailable.'; END IF;
  SELECT * INTO r FROM public.verified_game_runs WHERE id=p_run_id AND user_id=p_user_id FOR UPDATE;
  IF p_action='start' THEN
    IF FOUND THEN RETURN jsonb_build_object('success',true); END IF;
    IF EXISTS(SELECT 1 FROM public.verified_game_runs WHERE user_id=p_user_id AND started_at>clock_timestamp()-interval '5 seconds') THEN RAISE EXCEPTION 'Please wait before starting another game.'; END IF;
    duration:=(p_details->>'duration')::integer;
    IF duration IS NULL OR duration NOT BETWEEN 10 AND 3600 OR jsonb_array_length(p_details->'questions') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid game.'; END IF;
    -- Starting a new run ends the previous run; multiple tabs cannot stack rewards.
    UPDATE public.verified_game_runs SET finished_at=clock_timestamp(),result='{"success":true,"tokens":0,"xp":0,"abandoned":true}' WHERE user_id=p_user_id AND finished_at IS NULL;
    INSERT INTO public.verified_game_runs(id,user_id,questions,ends_at) VALUES(p_run_id,p_user_id,p_details->'questions',clock_timestamp()+make_interval(secs=>duration));
    RETURN jsonb_build_object('success',true);
  END IF;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Game not found.'; END IF;
  IF p_action='answer' THEN
    pos:=(p_details->>'ordinal')::integer; choice:=(p_details->>'answer')::integer;
    IF pos IS NULL OR choice IS NULL OR pos<0 OR pos>1200 OR choice NOT BETWEEN -1 AND 7 THEN RAISE EXCEPTION 'Invalid answer.'; END IF;
    IF pos<jsonb_array_length(r.answers) THEN
      IF (r.answers->>pos)::integer IS DISTINCT FROM choice THEN RAISE EXCEPTION 'Answer already submitted.'; END IF;
      RETURN jsonb_build_object('success',true);
    END IF;
    IF r.finished_at IS NOT NULL OR clock_timestamp()>r.ends_at OR pos<>jsonb_array_length(r.answers) THEN RAISE EXCEPTION 'Game ended or answer out of order.'; END IF;
    IF r.last_answer_at>clock_timestamp()-interval '250 milliseconds' THEN RAISE EXCEPTION 'Answers submitted too quickly.'; END IF;
    q:=r.questions->(pos % jsonb_array_length(r.questions));
    UPDATE public.verified_game_runs SET answers=answers||to_jsonb(choice),last_answer_at=clock_timestamp(),
      correct_count=correct_count+CASE WHEN (q->>'correct')::integer=choice AND NOT (q->>'key'=ANY(rewarded_keys)) THEN 1 ELSE 0 END,
      rewarded_keys=CASE WHEN (q->>'correct')::integer=choice AND NOT (q->>'key'=ANY(rewarded_keys)) THEN array_append(rewarded_keys,q->>'key') ELSE rewarded_keys END
      WHERE id=p_run_id;
    RETURN jsonb_build_object('success',true);
  ELSIF p_action='finish' THEN
    IF r.finished_at IS NOT NULL THEN RETURN r.result; END IF;
    IF clock_timestamp()<r.started_at+interval '5 seconds' THEN RAISE EXCEPTION 'Game is too short to settle.'; END IF;
    earned:=LEAST(r.correct_count*10,GREATEST(0,5000-COALESCE(u.discover_tokens_earned,0)));
    gained:=CASE WHEN earned>0 THEN r.correct_count*5 ELSE 0 END;
    remaining_xp:=COALESCE(u.xp,0)+gained; new_level:=COALESCE(u.level,1);
    WHILE new_level<100 AND remaining_xp>=new_level*100 LOOP
      remaining_xp:=remaining_xp-new_level*100; new_level:=new_level+1;
    END LOOP;
    new_booms:=COALESCE(u.booms,'{}');
    FOR milestone IN SELECT value FROM jsonb_array_elements(COALESCE(p_details->'milestones','[]')) LOOP
      IF (milestone->>'level')::integer>COALESCE(u.level,1) AND (milestone->>'level')::integer<=new_level THEN
        new_booms:=jsonb_set(new_booms,ARRAY[milestone->>'name'],to_jsonb(COALESCE((new_booms->>(milestone->>'name'))::integer,0)+1));
      END IF;
    END LOOP;
    UPDATE public.users SET tokens=COALESCE(tokens,0)+earned,
      discover_tokens_earned=COALESCE(discover_tokens_earned,0)+earned,
      total_tokens_earned=COALESCE(total_tokens_earned,0)+earned,
      xp=CASE WHEN new_level=100 THEN 0 ELSE remaining_xp END,level=new_level,
      season_xp=COALESCE(season_xp,0)+gained,
      games_played=COALESCE(games_played,0)+CASE WHEN r.correct_count>0 THEN 1 ELSE 0 END,
      correct_answers_count=COALESCE(correct_answers_count,0)+r.correct_count,
      questions_answered_count=COALESCE(questions_answered_count,0)+LEAST(jsonb_array_length(r.answers),jsonb_array_length(r.questions)),
      booms=new_booms
      WHERE id=p_user_id;
    -- Optional legacy modules receive only verified server-calculated progress.
    v_clan:=(to_jsonb(u)->>'clan_id')::uuid;
    IF v_clan IS NOT NULL AND gained>0 AND to_regclass('public.clans') IS NOT NULL THEN
      UPDATE public.clans SET xp=COALESCE(xp,0)+round(gained*COALESCE(xp_multiplier,1)),level=1+floor((COALESCE(xp,0)+round(gained*COALESCE(xp_multiplier,1)))/10000) WHERE id=v_clan;
    END IF;
    IF v_clan IS NOT NULL AND r.correct_count>0 AND to_regclass('public.tournament_clans') IS NOT NULL THEN
      UPDATE public.tournament_clans tc SET score=COALESCE(tc.score,0)+r.correct_count*10,games_played=COALESCE(tc.games_played,0)+1,last_played=clock_timestamp()
        FROM public.tournaments t WHERE tc.clan_id=v_clan AND tc.tournament_id=t.id AND t.status='active' AND t.end_time>clock_timestamp() AND t.start_time<=r.started_at;
    END IF;
    IF u.pinned_boom IS NOT NULL AND jsonb_array_length(r.answers)>0 AND to_regprocedure('public.decrement_rental_session(text,text)') IS NOT NULL THEN
      PERFORM public.decrement_rental_session(u.username,u.pinned_boom);
    END IF;
    IF gained>0 AND u.pinned_boom IS NOT NULL AND COALESCE((u.booms->>u.pinned_boom)::numeric,0)>0 AND to_regclass('public.user_boom_evolution') IS NOT NULL THEN
      INSERT INTO public.user_boom_evolution(username,boom_name,xp,level,is_fully_evolved) VALUES(u.username,u.pinned_boom,0,1,false) ON CONFLICT(username,boom_name) DO NOTHING;
      SELECT COALESCE(xp,0)+gained,COALESCE(level,1) INTO evolution_xp,evolution_level FROM public.user_boom_evolution WHERE username=u.username AND boom_name=u.pinned_boom FOR UPDATE;
      WHILE evolution_level<10 AND evolution_xp>=evolution_level*500 LOOP
        evolution_xp:=evolution_xp-evolution_level*500; evolution_level:=evolution_level+1;
      END LOOP;
      UPDATE public.user_boom_evolution SET xp=CASE WHEN evolution_level>=10 THEN 0 ELSE evolution_xp END,level=evolution_level,is_fully_evolved=evolution_level>=10 WHERE username=u.username AND boom_name=u.pinned_boom;
    END IF;
    IF r.correct_count>0 AND to_regprocedure('public.check_achievements(text,text,integer)') IS NOT NULL THEN
      PERFORM public.check_achievements(u.username,'games_played',COALESCE(u.games_played,0)+1);
    END IF;
    v_result:=jsonb_build_object('success',true,'tokens',earned,'xp',gained,'correct',r.correct_count,'level',new_level);
    UPDATE public.verified_game_runs SET finished_at=clock_timestamp(),result=v_result WHERE id=p_run_id;
    RETURN v_result;
  END IF;
  RAISE EXCEPTION 'Unsupported game action.';
END; $$;
REVOKE ALL ON FUNCTION public.apply_boomkit_game_action(text,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_boomkit_game_action(text,uuid,text,jsonb) TO service_role;

-- These tables feed rewards and must not have a second browser write path.
DO $$ DECLARE relation_name text; cols text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY['clans','tournaments','tournament_clans','tournament_participants','user_boom_evolution'] LOOP
    IF to_regclass('public.'||relation_name) IS NOT NULL THEN
      EXECUTE format('REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON public.%I FROM PUBLIC,anon,authenticated',relation_name);
      SELECT string_agg(quote_ident(attname),',') INTO cols FROM pg_attribute WHERE attrelid=to_regclass('public.'||relation_name) AND attnum>0 AND NOT attisdropped;
      EXECUTE format('REVOKE INSERT (%s), UPDATE (%s) ON public.%I FROM PUBLIC,anon,authenticated',cols,cols,relation_name);
      EXECUTE format('GRANT ALL ON public.%I TO service_role',relation_name);
    END IF;
  END LOOP;
END; $$;
COMMIT;
