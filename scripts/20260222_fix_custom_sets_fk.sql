-- Fix custom_sets storing string logic
BEGIN;

-- 1. Drop the RLS policies that depend on creator_id
DROP POLICY IF EXISTS "Users can read their own private sets" ON public.custom_sets;
DROP POLICY IF EXISTS "Users can insert their own sets" ON public.custom_sets;
DROP POLICY IF EXISTS "Users can update their own sets" ON public.custom_sets;
DROP POLICY IF EXISTS "Users can delete their own sets" ON public.custom_sets;

-- 2. Drop foreign key constraint referencing auth.users since some users might be purely local (string timestamp IDs)
ALTER TABLE public.custom_sets 
  DROP CONSTRAINT IF EXISTS custom_sets_creator_id_fkey;

-- 3. Alter creator_id to TEXT to support "1767078643963" style legacy IDs
ALTER TABLE public.custom_sets 
  ALTER COLUMN creator_id TYPE text USING creator_id::text;

-- 4. Recreate the RLS policies
create policy "Users can read their own private sets"
on public.custom_sets for select
using (auth.uid()::text = creator_id);

create policy "Users can insert their own sets"
on public.custom_sets for insert
with check (auth.uid()::text = creator_id);

create policy "Users can update their own sets"
on public.custom_sets for update
using (auth.uid()::text = creator_id);

create policy "Users can delete their own sets"
on public.custom_sets for delete
using (auth.uid()::text = creator_id);

COMMIT;
