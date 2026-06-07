drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (
  exists (
    select 1 from public."user"
    where id = auth.uid() and (is_admin = true or is_super_admin = true)
  )
)
with check (
  exists (
    select 1 from public."user"
    where id = auth.uid() and (is_admin = true or is_super_admin = true)
  )
);

drop policy if exists "Admins can manage practices" on public.practices;
create policy "Admins can manage practices"
on public.practices
for all
to authenticated
using (
  exists (
    select 1 from public."user"
    where id = auth.uid() and (is_admin = true or is_super_admin = true)
  )
)
with check (
  exists (
    select 1 from public."user"
    where id = auth.uid() and (is_admin = true or is_super_admin = true)
  )
);

drop policy if exists "Admins can manage audio banners" on public.audio_banners;
create policy "Admins can manage audio banners"
on public.audio_banners
for all
to authenticated
using (
  exists (
    select 1 from public."user"
    where id = auth.uid() and (is_admin = true or is_super_admin = true)
  )
)
with check (
  exists (
    select 1 from public."user"
    where id = auth.uid() and (is_admin = true or is_super_admin = true)
  )
);
