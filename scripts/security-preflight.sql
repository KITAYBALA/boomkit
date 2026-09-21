-- READ ONLY. Run before 029/030 against a staging copy of the deployed database.
SELECT name AS missing_table FROM unnest(ARRAY['users','user_secrets','access_keys','game_sessions','custom_sets','clan_chat_messages','clans','friends','boom_rentals','promo_codes','promo_redemptions','verified_game_runs']) name WHERE to_regclass('public.'||name) IS NULL;
SELECT lower(username) AS duplicate_username,count(*) FROM public.users GROUP BY lower(username) HAVING count(*)>1;
SELECT count(*) AS invalid_balances FROM public.users WHERE tokens<0;
SELECT count(*) AS invalid_inventory_shapes FROM public.users WHERE jsonb_typeof(booms) IS DISTINCT FROM 'object';
SELECT count(*) AS invalid_inventory_entries FROM public.users u CROSS JOIN LATERAL jsonb_each(CASE WHEN jsonb_typeof(u.booms)='object' THEN u.booms ELSE '{}'::jsonb END) item
WHERE length(item.key) NOT BETWEEN 1 AND 128 OR CASE WHEN jsonb_typeof(item.value)='number' THEN item.value::text::numeric<0 OR item.value::text::numeric>1000000000 OR item.value::text::numeric<>trunc(item.value::text::numeric) ELSE true END;
SELECT c.relname,a.attname AS column_name,format_type(a.atttypid,a.atttypmod) AS type FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('users','game_sessions','access_keys','clans','boom_rentals') AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attnum;
-- After applying the migrations, this must return no rows.
SELECT table_name,privilege_type,grantee FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee IN ('anon','authenticated','PUBLIC') AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE');
