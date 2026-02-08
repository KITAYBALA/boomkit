-- Create custom_sets table
create table if not exists public.custom_sets (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  grade integer not null,
  subject text not null,
  questions jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.custom_sets enable row level security;

-- Policies
create policy "Anyone can read public sets"
on public.custom_sets for select
using (is_public = true);

create policy "Users can read their own private sets"
on public.custom_sets for select
using (auth.uid() = creator_id);

create policy "Users can insert their own sets"
on public.custom_sets for insert
with check (auth.uid() = creator_id);

create policy "Users can update their own sets"
on public.custom_sets for update
using (auth.uid() = creator_id);

create policy "Users can delete their own sets"
on public.custom_sets for delete
using (auth.uid() = creator_id);
