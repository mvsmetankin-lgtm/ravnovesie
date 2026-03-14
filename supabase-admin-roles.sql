alter table public."user"
  add column if not exists is_admin boolean not null default false,
  add column if not exists is_super_admin boolean not null default false;

update public."user"
set
  is_admin = true,
  is_super_admin = true
where lower(email) = 'mvsmetankin@gmail.com';
