# Owner Setup for Row Level Security

The database uses a single-owner security model. Only the authenticated user whose UUID is stored in `app_settings` can read or write `vendors`, `items`, and `purchases`.

## Step 1: Run the migrations

In the Supabase dashboard, open **SQL Editor** and run:

1. `supabase/migrations/001_initial_purchase_schema.sql` (if not already run)
2. `supabase/migrations/002_owner_settings_table.sql` (required fix for Supabase hosted)

Or, if using the Supabase CLI locally:

```bash
supabase db push
```

## Step 2: Get your owner user UUID

1. Open **Authentication** → **Users** in the Supabase dashboard.
2. Click your owner account (e.g. `test@gmail.com`).
3. Copy the **User UID** (a UUID like `1e3743c0-cc52-4f94-aeec-a9a2ccb1642a`).

## Step 3: Configure the owner user ID

`alter database set` does **not** work on Supabase hosted projects. Instead, insert your UUID into `app_settings`.

In **SQL Editor**, run (replace with your actual UUID):

```sql
insert into public.app_settings (id, owner_user_id)
values (1, '1e3743c0-cc52-4f94-aeec-a9a2ccb1642a')
on conflict (id) do update
  set owner_user_id = excluded.owner_user_id,
      updated_at = now();
```

Migration `002_owner_settings_table.sql` already includes this insert with your UUID if you run the full file.

### Verify the setting

```sql
select owner_user_id from public.app_settings where id = 1;
```

You should see your UUID returned.

## Step 4: Confirm RLS is working

1. Sign in to the app with your owner account — queries should succeed.
2. If another user signs in, they should see no data and cannot insert rows.
3. Run the checks in `supabase/verify_schema.sql` for automated validation.

## Changing the owner later

```sql
update public.app_settings
set owner_user_id = 'NEW_OWNER_UUID', updated_at = now()
where id = 1;
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `permission denied to set parameter "app.owner_user_id"` | Use `app_settings` insert/update instead — see Step 3 |
| All queries return empty / permission denied | Owner UUID in `app_settings` does not match your signed-in user |
| `select owner_user_id` returns no rows | Run the Step 3 insert SQL |
| Migration fails on re-run | Migrations are one-time; use `002` fix migration if you already ran `001` |
