alter table public."user"
  add column if not exists telegram_id text,
  add column if not exists telegram_username text,
  add column if not exists avatar_url text,
  add column if not exists auth_provider text default 'email';

create unique index if not exists user_telegram_id_key on public."user"(telegram_id);
