-- Safe additive migration: carton support
-- Does NOT modify or delete any existing items or purchases.
-- Existing weight/piece rows keep pieces_per_carton = NULL and work unchanged.

-- 1) New enum value (additive only)
alter type public.measurement_type add value if not exists 'carton';

-- 2) Optional pack size on items (NULL for all current rows)
alter table public.items
  add column if not exists pieces_per_carton integer;

-- 3) Validate pack size without rewriting existing data
--    Use ::text so this can run safely after ADD VALUE.
alter table public.items
  drop constraint if exists items_pieces_per_carton_valid;

alter table public.items
  add constraint items_pieces_per_carton_valid check (
    (
      measurement_type::text = 'carton'
      and pieces_per_carton is not null
      and pieces_per_carton > 0
    )
    or (
      measurement_type::text in ('weight', 'piece')
      and pieces_per_carton is null
    )
  );

-- 4) Purchases: carton items store carton count in quantity_pieces
--    (same exclusive quantity check as piece items — no purchase row changes)
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

  if item_measurement::text = 'weight' then
    if new.quantity_kg is null or new.quantity_pieces is not null then
      raise exception 'Weight items must use quantity_kg only';
    end if;
  elsif item_measurement::text in ('piece', 'carton') then
    if new.quantity_pieces is null or new.quantity_kg is not null then
      raise exception 'Piece/carton items must use quantity_pieces only';
    end if;
  end if;

  return new;
end;
$$;
