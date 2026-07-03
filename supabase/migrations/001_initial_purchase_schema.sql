-- Purchase Tracker: initial schema
-- Tables: vendors, items, purchases
-- Single-owner RLS via app.owner_user_id database setting

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

create type public.measurement_type as enum ('weight', 'piece');

-- ---------------------------------------------------------------------------
-- Shared trigger functions
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.enforce_purchase_measurement_type()
returns trigger
language plpgsql
as $$
declare
  item_measurement public.measurement_type;
begin
  select measurement_type
  into item_measurement
  from public.items
  where id = new.item_id;

  if item_measurement is null then
    raise exception 'Item not found for purchase';
  end if;

  if item_measurement = 'weight' then
    if new.quantity_kg is null or new.quantity_pieces is not null then
      raise exception 'Weight items must use quantity_kg only';
    end if;
  elsif item_measurement = 'piece' then
    if new.quantity_pieces is null or new.quantity_kg is not null then
      raise exception 'Piece items must use quantity_pieces only';
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Vendors
-- ---------------------------------------------------------------------------

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendors_name_not_empty check (length(trim(name)) > 0)
);

create unique index vendors_name_lower_unique on public.vendors (lower(name));

create trigger vendors_set_updated_at
  before update on public.vendors
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Items
-- ---------------------------------------------------------------------------

create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  measurement_type public.measurement_type not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_name_not_empty check (length(trim(name)) > 0)
);

create unique index items_name_lower_unique on public.items (lower(name));

create trigger items_set_updated_at
  before update on public.items
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Purchases
-- ---------------------------------------------------------------------------

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  item_id uuid not null references public.items (id) on delete restrict,
  purchased_at timestamptz not null default now(),
  quantity_kg numeric(12, 3),
  quantity_pieces integer,
  cost_price numeric(12, 2) not null,
  retail_price numeric(12, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchases_quantity_exclusive check (
    (
      quantity_kg is not null
      and quantity_pieces is null
      and quantity_kg > 0
    )
    or (
      quantity_kg is null
      and quantity_pieces is not null
      and quantity_pieces > 0
    )
  ),
  constraint purchases_cost_price_non_negative check (cost_price >= 0),
  constraint purchases_retail_price_non_negative check (retail_price >= 0)
);

create index purchases_purchased_at_desc_idx on public.purchases (purchased_at desc);
create index purchases_vendor_id_idx on public.purchases (vendor_id);
create index purchases_item_id_idx on public.purchases (item_id);

create trigger purchases_set_updated_at
  before update on public.purchases
  for each row
  execute function public.set_updated_at();

create trigger purchases_enforce_measurement_type
  before insert or update on public.purchases
  for each row
  execute function public.enforce_purchase_measurement_type();

-- ---------------------------------------------------------------------------
-- Row Level Security (single owner)
-- Owner UUID is stored in app_settings (Supabase blocks alter database set).
-- ---------------------------------------------------------------------------

create table public.app_settings (
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

alter table public.vendors enable row level security;
alter table public.items enable row level security;
alter table public.purchases enable row level security;

-- Vendors policies
create policy "Owner can read vendors"
  on public.vendors
  for select
  to authenticated
  using (public.is_owner());

create policy "Owner can insert vendors"
  on public.vendors
  for insert
  to authenticated
  with check (public.is_owner());

create policy "Owner can update vendors"
  on public.vendors
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "Owner can delete vendors"
  on public.vendors
  for delete
  to authenticated
  using (public.is_owner());

-- Items policies
create policy "Owner can read items"
  on public.items
  for select
  to authenticated
  using (public.is_owner());

create policy "Owner can insert items"
  on public.items
  for insert
  to authenticated
  with check (public.is_owner());

create policy "Owner can update items"
  on public.items
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "Owner can delete items"
  on public.items
  for delete
  to authenticated
  using (public.is_owner());

-- Purchases policies
create policy "Owner can read purchases"
  on public.purchases
  for select
  to authenticated
  using (public.is_owner());

create policy "Owner can insert purchases"
  on public.purchases
  for insert
  to authenticated
  with check (public.is_owner());

create policy "Owner can update purchases"
  on public.purchases
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "Owner can delete purchases"
  on public.purchases
  for delete
  to authenticated
  using (public.is_owner());
