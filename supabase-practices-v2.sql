-- Extend practices table with new fields
ALTER TABLE public.practices
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS views_count int not null default 0,
  ADD COLUMN IF NOT EXISTS likes_count int not null default 0,
  ADD COLUMN IF NOT EXISTS dislikes_count int not null default 0;

-- Per-user likes tracking
CREATE TABLE IF NOT EXISTS public.practice_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  UNIQUE(user_id, practice_id)
);

ALTER TABLE public.practice_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own practice likes" ON public.practice_likes;
CREATE POLICY "Users can manage own practice likes"
ON public.practice_likes FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_practice_views(p_id uuid)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE public.practices SET views_count = views_count + 1 WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.update_practice_like_counts(p_id uuid)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE public.practices
  SET
    likes_count = (SELECT count(*) FROM public.practice_likes WHERE practice_id = p_id AND value = 1),
    dislikes_count = (SELECT count(*) FROM public.practice_likes WHERE practice_id = p_id AND value = -1)
  WHERE id = p_id;
$$;
