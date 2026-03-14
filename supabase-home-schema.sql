create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text,
  video_url text,
  reel_text text,
  sort_order int default 0,
  is_active boolean not null default true
);

create table if not exists public.practices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  duration_minutes int default 0,
  level text,
  image_url text,
  is_featured boolean not null default false,
  sort_order int default 0
);

create table if not exists public.audio_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text,
  theme text,
  sort_order int default 0,
  is_active boolean not null default true
);

create table if not exists public.daily_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  words_count int not null default 0,
  goal_words int not null default 110
);

alter table public.categories enable row level security;
alter table public.practices enable row level security;
alter table public.audio_banners enable row level security;
alter table public.daily_progress enable row level security;

drop policy if exists "Authenticated users can read categories" on public.categories;
create policy "Authenticated users can read categories"
on public.categories
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read practices" on public.practices;
create policy "Authenticated users can read practices"
on public.practices
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read audio banners" on public.audio_banners;
create policy "Authenticated users can read audio banners"
on public.audio_banners
for select
to authenticated
using (true);

drop policy if exists "Users can read own daily progress" on public.daily_progress;
create policy "Users can read own daily progress"
on public.daily_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own daily progress" on public.daily_progress;
create policy "Users can insert own daily progress"
on public.daily_progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily progress" on public.daily_progress;
create policy "Users can update own daily progress"
on public.daily_progress
for update
to authenticated
using (auth.uid() = user_id);
