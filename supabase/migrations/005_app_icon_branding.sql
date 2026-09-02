-- Safe additive migration: app icon (PWA / home-screen icon) branding.
-- Does NOT modify or delete any existing tables, rows, or policies.

-- 1) Icon URL on the single-row app_settings table (NULL = no custom icon yet)
alter table public.app_settings
  add column if not exists icon_url text;

-- 2) app_settings had RLS enabled but no policies (only reachable via the
--    security-definer is_owner() function). Let the owner read/update their
--    own settings row directly, same pattern as vendors/items/purchases.
drop policy if exists "Owner can read app settings" on public.app_settings;
create policy "Owner can read app settings"
  on public.app_settings
  for select
  to authenticated
  using (public.is_owner());

drop policy if exists "Owner can update app settings" on public.app_settings;
create policy "Owner can update app settings"
  on public.app_settings
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- 3) Storage bucket for the uploaded icon file.
--    Public read so the OS/browser can fetch it for the home-screen icon
--    without a Supabase session; only the owner can upload/replace/remove it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  2097152, -- 2MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view branding files" on storage.objects;
create policy "Public can view branding files"
  on storage.objects
  for select
  to public
  using (bucket_id = 'branding');

drop policy if exists "Owner can upload branding files" on storage.objects;
create policy "Owner can upload branding files"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'branding' and public.is_owner());

drop policy if exists "Owner can update branding files" on storage.objects;
create policy "Owner can update branding files"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'branding' and public.is_owner())
  with check (bucket_id = 'branding' and public.is_owner());

drop policy if exists "Owner can delete branding files" on storage.objects;
create policy "Owner can delete branding files"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'branding' and public.is_owner());
