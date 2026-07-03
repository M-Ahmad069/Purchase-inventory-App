-- Fix: Supabase hosted projects do not allow custom database parameters
-- via alter database set. Store the owner UUID in app_settings instead.

create table if not exists public.app_settings (
  id integer primary key check (id = 1),
  owner_user_id uuid not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
-- No policies: table is read only via security definer is_owner().

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = (select owner_user_id from public.app_settings where id = 1);
$$;

-- Set your owner (run once; safe to re-run with on conflict):
insert into public.app_settings (id, owner_user_id)
values (1, '1e3743c0-cc52-4f94-aeec-a9a2ccb1642a')
on conflict (id) do update
  set owner_user_id = excluded.owner_user_id,
      updated_at = now();
