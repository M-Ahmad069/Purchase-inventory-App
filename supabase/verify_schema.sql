-- Purchase Tracker schema verification
-- Run in Supabase SQL Editor after migration and owner setup.
-- Replace placeholder UUIDs/values as needed.

-- ---------------------------------------------------------------------------
-- 1. Confirm owner setting is configured
-- ---------------------------------------------------------------------------

select owner_user_id from public.app_settings where id = 1;
-- Expected: your owner Auth user UUID (not null)

-- ---------------------------------------------------------------------------
-- 2. Confirm tables and RLS are enabled
-- ---------------------------------------------------------------------------

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('vendors', 'items', 'purchases')
order by c.relname;

-- Expected: all three tables with rls_enabled = true

-- ---------------------------------------------------------------------------
-- 3. Confirm policies exist (12 total: 4 per table)
-- ---------------------------------------------------------------------------

select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('vendors', 'items', 'purchases')
order by tablename, policyname;

-- ---------------------------------------------------------------------------
-- 4. Measurement consistency checks (run as service role or bypass RLS)
--    These tests insert invalid data and should FAIL.
-- ---------------------------------------------------------------------------

-- Setup test data (delete first if re-running)
delete from public.purchases where notes = '__verify_test__';
delete from public.items where name in ('__Verify Rice__', '__Verify Shampoo__');
delete from public.vendors where name = '__Verify Vendor__';

insert into public.vendors (name) values ('__Verify Vendor__');
insert into public.items (name, measurement_type) values
  ('__Verify Rice__', 'weight'),
  ('__Verify Shampoo__', 'piece');

-- Test A: weight item with pieces only — should FAIL
-- insert into public.purchases (vendor_id, item_id, quantity_pieces, cost_price, retail_price, notes)
-- select v.id, i.id, 5, 100.00, 120.00, '__verify_test__'
-- from public.vendors v, public.items i
-- where v.name = '__Verify Vendor__' and i.name = '__Verify Rice__';

-- Test B: piece item with kg only — should FAIL
-- insert into public.purchases (vendor_id, item_id, quantity_kg, cost_price, retail_price, notes)
-- select v.id, i.id, 2.5, 100.00, 120.00, '__verify_test__'
-- from public.vendors v, public.items i
-- where v.name = '__Verify Vendor__' and i.name = '__Verify Shampoo__';

-- Test C: weight item with correct quantity_kg — should SUCCEED
insert into public.purchases (vendor_id, item_id, quantity_kg, cost_price, retail_price, notes)
select v.id, i.id, 25.000, 2500.00, 2800.00, '__verify_test__'
from public.vendors v, public.items i
where v.name = '__Verify Vendor__' and i.name = '__Verify Rice__';

-- Test D: piece item with correct quantity_pieces — should SUCCEED
insert into public.purchases (vendor_id, item_id, quantity_pieces, cost_price, retail_price, notes)
select v.id, i.id, 12, 600.00, 750.00, '__verify_test__'
from public.vendors v, public.items i
where v.name = '__Verify Vendor__' and i.name = '__Verify Shampoo__';

-- Verify test rows
select
  p.notes,
  i.name as item_name,
  i.measurement_type,
  p.quantity_kg,
  p.quantity_pieces,
  p.cost_price,
  p.retail_price
from public.purchases p
join public.items i on i.id = p.item_id
where p.notes = '__verify_test__';

-- Cleanup test data
delete from public.purchases where notes = '__verify_test__';
delete from public.items where name in ('__Verify Rice__', '__Verify Shampoo__');
delete from public.vendors where name = '__Verify Vendor__';

-- ---------------------------------------------------------------------------
-- 5. Owner access check (run while authenticated as owner in the app)
--    From the app/API, these should return data when logged in as owner:
--      select * from vendors;
--      select * from items;
--      select * from purchases;
--    From a non-owner authenticated session, all should return 0 rows.
-- ---------------------------------------------------------------------------
