-- Create banned_systems table to track banned computer/system signatures
-- This prevents banned users from creating new accounts on the same device

create table if not exists banned_systems (
  id uuid default gen_random_uuid() primary key,
  system_signature text not null unique,
  banned_at timestamp with time zone default now(),
  banned_by text not null,
  reason text,
  user_id text,
  username text
);

-- Create index for faster lookups during registration
create index if not exists idx_banned_systems_signature on banned_systems(system_signature);

-- Add comment to table
comment on table banned_systems is 'Tracks banned system signatures to prevent account recreation';
comment on column banned_systems.system_signature is 'Unique fingerprint of the banned computer/browser';
comment on column banned_systems.banned_by is 'Username of the staff member who issued the ban';
comment on column banned_systems.user_id is 'ID of the banned user account';
comment on column banned_systems.username is 'Username of the banned user';
