-- Safe additive migration: let anyone (including logged-out visitors)
-- resolve just the current app icon URL, without exposing the rest of
-- app_settings. Needed so the login page and browser-tab favicon show the
-- icon before the owner is authenticated (app_settings itself stays
-- owner-only per migration 005).

create or replace function public.get_app_icon_url()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select icon_url from public.app_settings where id = 1;
$$;

grant execute on function public.get_app_icon_url() to anon, authenticated;
