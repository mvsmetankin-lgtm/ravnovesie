create table if not exists public.journal_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  daily_word_goal int not null default 110,
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  word_count int not null default 0,
  emotion_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_goals enable row level security;
alter table public.journal_entries enable row level security;

drop policy if exists "Users can read own journal goals" on public.journal_goals;
create policy "Users can read own journal goals"
on public.journal_goals
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can upsert own journal goals" on public.journal_goals;
create policy "Users can upsert own journal goals"
on public.journal_goals
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own journal entries" on public.journal_entries;
create policy "Users can read own journal entries"
on public.journal_entries
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own journal entries" on public.journal_entries;
create policy "Users can insert own journal entries"
on public.journal_entries
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own journal entries" on public.journal_entries;
create policy "Users can update own journal entries"
on public.journal_entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own journal entries" on public.journal_entries;
create policy "Users can delete own journal entries"
on public.journal_entries
for delete
to authenticated
using (auth.uid() = user_id);
