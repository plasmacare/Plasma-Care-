-- Run in Supabase SQL editor. Tightens staff_profiles so Admin cannot
-- see, edit, or create a 'developer' row — not just hidden in the UI,
-- blocked at the database level too. Only the developer's own login can
-- see their own row (via the existing "id = auth.uid()" self-read).

drop policy if exists "read own or admin reads all" on staff_profiles;
create policy "read own or admin reads all"
  on staff_profiles for select
  to authenticated
  using (id = auth.uid() or (current_staff_role() = 'admin' and role <> 'developer'));

drop policy if exists "admin manages profiles" on staff_profiles;
create policy "admin manages profiles"
  on staff_profiles for all
  to authenticated
  using (current_staff_role() = 'admin' and role <> 'developer')
  with check (current_staff_role() = 'admin' and role <> 'developer');

-- The `with check` clause above also stops admin from promoting anyone
-- to 'developer' through the Access tab (or any direct table write) —
-- the new row's role can never be 'developer' for an admin-authored
-- write, so that value is rejected outright.

-- Existing developer accounts you already created (before running this)
-- are unaffected — they were created by you directly in the SQL editor,
-- which runs as postgres and bypasses RLS entirely.
