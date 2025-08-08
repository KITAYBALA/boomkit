-- Boomkit schema v1
-- Run this in Supabase SQL Editor (once)

-- 1) Extensions (for UUIDs)
create extension if not exists pgcrypto;

-- 2) Profiles: player data tied to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text,
  tokens integer not null default 0,
  daily_tokens integer not null default 0,
  packs jsonb not null default '[]'::jsonb,      -- array of pack ids
  booms jsonb not null default '{}'::jsonb,      -- { "Boom Name": qty }
  role text not null default 'player',
  is_owner boolean not null default false,
  is_banned boolean not null default false,
  is_muted boolean not null default false,
  mute_expiry timestamptz,
  ban_expiry timestamptz,
  ban_reason text,
  badges text[] not null default '{}',
  name_color text not null default 'white',
  banner_color text not null default 'purple',
  boom_score integer not null default 0,
  total_value integer not null default 0,
  last_daily_spin date,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 3) Global chat
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  username text not null,
  role text default 'Player',
  message text not null check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_created_at on public.chat_messages(created_at desc);

-- 4) Auction house
create table if not exists public.auction_items (
  id uuid primary key default gen_random_uuid(),
  boom_name text not null,
  seller_user_id uuid references auth.users(id) on delete set null,
  seller_username text not null,
  current_bid integer not null check (current_bid > 0),
  ends_at timestamptz not null,
  bidders jsonb not null default '[]'::jsonb, -- array of { username, amount, at }
  created_at timestamptz not null default now()
);
create index if not exists idx_auction_active on public.auction_items(ends_at);
create index if not exists idx_auction_boom on public.auction_items(boom_name);

-- Place bid RPC with optimistic check (active and higher bid)
create or replace function public.place_bid(p_auction_id uuid, p_amount int, p_username text, p_user_id uuid)
returns public.auction_items
language plpgsql
as $$
declare
  updated_row public.auction_items;
begin
  update public.auction_items
  set
    current_bid = p_amount,
    bidders = bidders || jsonb_build_array(json_build_object('username', p_username, 'amount', p_amount, 'at', now()))
  where id = p_auction_id
    and now() < ends_at
    and p_amount > current_bid
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'Bid rejected: auction ended or amount too low';
  end if;

  return updated_row;
end;
$$;

-- 5) Row Level Security (RLS)
alter table public.profiles       enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.auction_items  enable row level security;

-- profiles: read all, update self
drop policy if exists "profiles read public" on public.profiles;
create policy "profiles read public" on public.profiles
for select using (true);

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
for update using (auth.uid() = id);

-- chat: read all; insert open (dev-friendly). Harden later if needed.
drop policy if exists "chat read public" on public.chat_messages;
create policy "chat read public" on public.chat_messages
for select using (true);

drop policy if exists "chat insert open" on public.chat_messages;
create policy "chat insert open" on public.chat_messages
for insert with check (true);

-- auctions: read all; insert for authenticated; updates only via RPC
drop policy if exists "auction read public" on public.auction_items;
create policy "auction read public" on public.auction_items
for select using (true);

drop policy if exists "auction insert auth" on public.auction_items;
create policy "auction insert auth" on public.auction_items
for insert with check (auth.role() = 'authenticated');

drop policy if exists "auction update none" on public.auction_items;
create policy "auction update none" on public.auction_items
for update using (false) with check (false);

grant execute on function public.place_bid(uuid, int, text, uuid) to anon, authenticated;
