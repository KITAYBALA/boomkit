-- One-off repair for the three account IDs shown in the duplicate report.
-- Back up first. Stop the website and Discord bot during this transaction.
-- Run the ENTIRE file in SQL Editor, then rerun the duplicate diagnostic and 025.
-- No accounts, credentials, balances or inventory are deleted or merged.
-- A single DO statement keeps temporary objects and the repair in one transaction.
-- Use ordinary Run, not an automatic RLS/policy generator. No RLS changes are needed here.
DO $repair$
BEGIN
PERFORM set_config('lock_timeout','5s',true);
LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE boomkit_name_repair (
  user_id text PRIMARY KEY,
  new_name text NOT NULL UNIQUE,
  old_name text
) ON COMMIT DROP;
INSERT INTO boomkit_name_repair(user_id,new_name) VALUES
  ('6388a2c4-af75-4652-8d63-f0321ff83ca8','Player_6388'),
  ('b080a68e-c39d-477a-837f-0614fd9c1459','Player_b080'),
  ('ced4071c-1dda-476c-b0db-ce3ab7ef70ff','User123_2');
UPDATE boomkit_name_repair m SET old_name=u.username FROM public.users u WHERE u.id::text=m.user_id;

-- Only known username reference columns are changed; message bodies and audit prose stay intact.
CREATE TEMP TABLE boomkit_name_columns ON COMMIT DROP AS
SELECT c.table_name,c.column_name,c.udt_name
FROM information_schema.columns c JOIN information_schema.tables t
  ON t.table_schema=c.table_schema AND t.table_name=c.table_name
WHERE c.table_schema='public' AND t.table_type='BASE TABLE' AND c.table_name<>'users'
  AND (c.column_name='username' OR c.column_name LIKE '%\_username' ESCAPE '\'
    OR (c.table_name='clans' AND c.column_name='leader')
    OR (c.table_name='auction_items' AND c.column_name IN ('seller','top_bidder')));

DECLARE c record; m record; conflict boolean;
BEGIN
  IF EXISTS(SELECT 1 FROM boomkit_name_repair WHERE old_name IS NULL) THEN
    RAISE EXCEPTION 'A target account ID is missing. Nothing changed; check the duplicate report.';
  END IF;
  IF EXISTS(SELECT 1 FROM boomkit_name_columns WHERE udt_name NOT IN ('text','varchar','bpchar')) THEN
    RAISE EXCEPTION 'Unsupported username column type. Nothing changed; inspect the deployed schema.';
  END IF;
  -- Immediate non-cascading username foreign keys require a schema-specific migration.
  IF EXISTS(SELECT 1 FROM pg_constraint k JOIN pg_attribute a ON a.attrelid=k.confrelid AND a.attnum=ANY(k.confkey)
    WHERE k.contype='f' AND k.confrelid='public.users'::regclass AND a.attname='username' AND k.confupdtype<>'c') THEN
    RAISE EXCEPTION 'A non-cascading username foreign key needs review. Nothing changed.';
  END IF;
  FOR c IN SELECT DISTINCT table_name FROM boomkit_name_columns ORDER BY table_name LOOP
    EXECUTE format('LOCK TABLE public.%I IN SHARE ROW EXCLUSIVE MODE',c.table_name);
  END LOOP;
  FOR m IN SELECT * FROM boomkit_name_repair WHERE old_name<>new_name LOOP
    IF (SELECT count(*) FROM public.users WHERE username::text COLLATE "C"=m.old_name COLLATE "C")<>1 THEN
      RAISE EXCEPTION 'An old username belongs to multiple exact-match accounts. Nothing changed.';
    END IF;
    IF EXISTS(SELECT 1 FROM public.users WHERE lower(username)=lower(m.new_name) AND id::text<>m.user_id) THEN
      RAISE EXCEPTION 'Replacement username % is already in use. Nothing changed.',m.new_name;
    END IF;
    FOR c IN SELECT * FROM boomkit_name_columns LOOP
      EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE lower(%I::text)=lower($1))',c.table_name,c.column_name)
        INTO conflict USING m.new_name;
      IF conflict THEN RAISE EXCEPTION 'Replacement % already appears in %.%; review ownership first. Nothing changed.',m.new_name,c.table_name,c.column_name; END IF;
    END LOOP;
  END LOOP;
END;

-- Handle structured participant snapshots without replacing arbitrary text inside JSON.
CREATE OR REPLACE FUNCTION pg_temp.boomkit_rename_participants(doc jsonb, reaction_names boolean)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE result jsonb; replacement text; entry record;
BEGIN
  IF jsonb_typeof(doc)='array' THEN
    SELECT COALESCE(jsonb_agg(pg_temp.boomkit_rename_participants(value,reaction_names) ORDER BY ordinality),'[]'::jsonb)
      INTO result FROM jsonb_array_elements(doc) WITH ORDINALITY;
    RETURN result;
  ELSIF jsonb_typeof(doc)='object' THEN
    result:=doc;
    IF reaction_names THEN
      FOR entry IN SELECT * FROM jsonb_each(doc) LOOP
        result:=jsonb_set(result,ARRAY[entry.key],pg_temp.boomkit_rename_participants(entry.value,true));
      END LOOP;
    ELSE
      SELECT new_name INTO replacement FROM boomkit_name_repair WHERE old_name COLLATE "C"=(doc->>'username') COLLATE "C" AND old_name<>new_name;
      IF FOUND THEN result:=jsonb_set(result,'{username}',to_jsonb(replacement)); END IF;
    END IF;
    RETURN result;
  ELSIF jsonb_typeof(doc)='string' THEN
    SELECT new_name INTO replacement FROM boomkit_name_repair WHERE old_name COLLATE "C"=(doc#>>'{}') COLLATE "C" AND old_name<>new_name;
    IF FOUND THEN RETURN to_jsonb(replacement); END IF;
  END IF;
  RETURN doc;
END $$;

DECLARE c record; m record;
BEGIN
  -- Parent first permits ON UPDATE CASCADE; the subsequent exact-match updates cover plain text links.
  UPDATE public.users u SET username=names.new_name FROM boomkit_name_repair names
    WHERE u.id::text=names.user_id AND names.old_name<>names.new_name;
  FOR c IN SELECT * FROM boomkit_name_columns ORDER BY table_name,column_name LOOP
    EXECUTE format('UPDATE public.%I t SET %I=m.new_name FROM boomkit_name_repair m WHERE t.%I::text COLLATE "C"=m.old_name COLLATE "C" AND m.old_name<>m.new_name',c.table_name,c.column_name,c.column_name);
  END LOOP;
  FOR c IN SELECT table_name,column_name,udt_name FROM information_schema.columns
    WHERE table_schema='public' AND ((table_name='game_sessions' AND column_name='players')
      OR (table_name='auction_items' AND column_name='bidders')
      OR (table_name IN ('chat_messages','direct_messages','clan_chat_messages') AND column_name='reactions')) LOOP
    IF c.udt_name IN ('json','jsonb') THEN
      EXECUTE format('UPDATE public.%I SET %I=pg_temp.boomkit_rename_participants(%I::jsonb,$1)::%s WHERE %I IS NOT NULL AND %I::jsonb IS DISTINCT FROM pg_temp.boomkit_rename_participants(%I::jsonb,$1)',
        c.table_name,c.column_name,c.column_name,c.udt_name,c.column_name,c.column_name,c.column_name) USING c.column_name='reactions';
    ELSIF c.table_name='auction_items' AND c.column_name='bidders' AND c.udt_name='_text' THEN
      FOR m IN SELECT * FROM boomkit_name_repair WHERE old_name<>new_name LOOP
        UPDATE public.auction_items SET bidders=array_replace(bidders,m.old_name,m.new_name) WHERE m.old_name=ANY(bidders);
      END LOOP;
    ELSE RAISE EXCEPTION 'Unsupported type for %.%. Nothing changed.',c.table_name,c.column_name;
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM public.users GROUP BY lower(username) HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Additional duplicate usernames remain. Nothing changed; rerun the diagnostic.';
  END IF;
END;

-- Prevent another conflicting registration between this repair and migration 025.
CREATE UNIQUE INDEX IF NOT EXISTS users_username_case_unique ON public.users(lower(username));

DROP FUNCTION pg_temp.boomkit_rename_participants(jsonb,boolean);
RAISE NOTICE 'Username repair completed. Run check_duplicate_identities.sql next.';
END $repair$;
