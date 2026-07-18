-- Safe additive: weight buy unit (per kg vs per maan / 40 kg)
-- Does NOT modify existing items or purchases.
-- Existing weight items keep kg_per_unit = NULL (= per kg).

alter table public.items
  add column if not exists kg_per_unit integer;

alter table public.items
  drop constraint if exists items_kg_per_unit_valid;

alter table public.items
  add constraint items_kg_per_unit_valid check (
    (
      measurement_type::text = 'weight'
      and (kg_per_unit is null or kg_per_unit > 0)
    )
    or (
      measurement_type::text <> 'weight'
      and kg_per_unit is null
    )
  );
