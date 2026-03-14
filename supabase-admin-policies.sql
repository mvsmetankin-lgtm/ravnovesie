-- Replace admin@example.com with the email of the admin user.

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using ((auth.jwt() ->> 'email') in ('admin@example.com'))
with check ((auth.jwt() ->> 'email') in ('admin@example.com'));

drop policy if exists "Admins can manage practices" on public.practices;
create policy "Admins can manage practices"
on public.practices
for all
to authenticated
using ((auth.jwt() ->> 'email') in ('admin@example.com'))
with check ((auth.jwt() ->> 'email') in ('admin@example.com'));

drop policy if exists "Admins can manage audio banners" on public.audio_banners;
create policy "Admins can manage audio banners"
on public.audio_banners
for all
to authenticated
using ((auth.jwt() ->> 'email') in ('admin@example.com'))
with check ((auth.jwt() ->> 'email') in ('admin@example.com'));
