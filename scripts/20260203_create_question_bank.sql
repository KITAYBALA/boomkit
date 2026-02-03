-- Create Question Bank table for global storage of questions
create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  grade integer not null,
  subject text not null,
  topic text not null,
  question text not null,
  options jsonb not null, -- ["A", "B", "C", "D"]
  correct_index integer not null,
  created_at timestamptz not null default now()
);

-- Indexing for fast retrieval of random sets
create index if not exists idx_question_bank_lookup on public.question_bank(grade, subject, topic);

-- Enable RLS
alter table public.question_bank enable row level security;

-- Policies
-- Anyone can read questions
drop policy if exists "Anyone can read questions" on public.question_bank;
create policy "Anyone can read questions" on public.question_bank
for select using (true);

-- Authenticated users (the app) can insert new questions found via AI
drop policy if exists "Authenticated can insert questions" on public.question_bank;
create policy "Authenticated can insert questions" on public.question_bank
for insert with check (auth.role() = 'authenticated');

-- Service role can do everything (for seeding scripts)
-- Note: Service role bypasses RLS by default in Supabase

-- Add a UNIQUE constraint to prevent duplicate questions within the same topic
-- (Optional but recommended if question text is unique)
-- alter table public.question_bank add constraint unique_question_per_topic unique (topic, question);
