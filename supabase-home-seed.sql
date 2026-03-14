-- MindFlow home screen seed
-- 1. Replace the email below with the email of the user who should see progress on Home.
-- 2. Run this file after supabase-home-schema.sql in Supabase SQL Editor.

do $$
declare
  target_user_id uuid;
  target_email text := 'replace-with-your-email@example.com';
begin
  select id
  into target_user_id
  from auth.users
  where email = target_email
  limit 1;

  insert into public.categories (title, image_url, video_url, reel_text, sort_order, is_active)
  values
    (
      'Мотивация дня',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
      'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
      'Сделай глубокий вдох. Сегодня ты уже достаточно хороша, чтобы начать маленький шаг к себе.',
      1,
      true
    ),
    (
      'Мини практики',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
      'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-yoga-on-a-mat-4481-large.mp4',
      '10 секунд, чтобы выбрать короткую практику и мягко вернуть себе внимание и устойчивость.',
      2,
      true
    ),
    (
      'Природа и звуки',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-middle-of-the-jungle-4075-large.mp4',
      'Представь шум листьев, прохладный воздух и спокойный ритм. Пауза тоже часть продуктивности.',
      3,
      true
    ),
    (
      'График дыхания',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
      'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-woman-breathing-deeply-47884-large.mp4',
      'Следуй за ритмом: вдох, короткая пауза и длинный выдох. Тело быстро почувствует опору.',
      4,
      true
    )
  on conflict do nothing;

  insert into public.practices (
    title,
    subtitle,
    duration_minutes,
    level,
    image_url,
    is_featured,
    sort_order
  )
  values
    (
      'Йога',
      '#йога #mindbody',
      45,
      'Легкий уровень',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80',
      true,
      1
    ),
    (
      'Дыхание 4-7-8',
      '#дыхание #calm',
      10,
      'Быстрый старт',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80',
      true,
      2
    ),
    (
      'Растяжка',
      '#тело #баланс',
      20,
      'Средний уровень',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
      true,
      3
    )
  on conflict do nothing;

  insert into public.audio_banners (title, image_url, theme, sort_order, is_active)
  values
    (
      'Звуки спокойствия',
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80',
      'calm',
      1,
      true
    ),
    (
      'Звуки природы',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
      'nature',
      2,
      true
    )
  on conflict do nothing;

  if target_user_id is not null then
    insert into public.daily_progress (user_id, date, words_count, goal_words)
    values
      (target_user_id, current_date - 6, 65, 110),
      (target_user_id, current_date - 5, 0, 110),
      (target_user_id, current_date - 4, 92, 110),
      (target_user_id, current_date - 3, 115, 110),
      (target_user_id, current_date - 2, 0, 110),
      (target_user_id, current_date - 1, 74, 110),
      (target_user_id, current_date, 0, 110)
    on conflict do nothing;

    raise notice 'Seed completed for user % (%).', target_email, target_user_id;
  else
    raise notice 'Content seeded, but daily_progress was skipped because user with email % was not found.', target_email;
  end if;
end $$;
