-- Run in Supabase SQL editor. Upgrades the old free-text "assigned
-- staff" field on bookings to a real dispatch system: a proper link to
-- a staff_profiles row (role = 'collector'), plus a status workflow the
-- collector's own app drives (assigned -> accepted -> en_route ->
-- arrived -> collected), independent of the main booking.status column
-- (which stays admin/report-flow driven, unchanged).

alter table bookings
  add column if not exists assigned_collector_id uuid references staff_profiles(id),
  add column if not exists collection_status text not null default 'unassigned';
  -- collection_status: unassigned | assigned | accepted | declined |
  -- en_route | arrived | collected

create index if not exists bookings_assigned_collector_idx on bookings (assigned_collector_id);

-- Collectors can see and update only bookings assigned to them. This is
-- row-level (same trust model as the rest of this app's staff access —
-- staff already see full booking rows elsewhere), not column-level, so
-- a collector can technically see the booking amount etc. If you want
-- collectors to see a stripped-down view instead, that would need a
-- Postgres view + a separate policy — flag it if you want that added.
drop policy if exists "collector reads assigned bookings" on bookings;
create policy "collector reads assigned bookings"
  on bookings for select
  to authenticated
  using (assigned_collector_id = auth.uid() or current_staff_role() in ('admin', 'staff'));

drop policy if exists "collector updates assigned bookings" on bookings;
create policy "collector updates assigned bookings"
  on bookings for update
  to authenticated
  using (assigned_collector_id = auth.uid())
  with check (assigned_collector_id = auth.uid());

-- NOTE: this assumes `bookings` didn't already have broader
-- staff/admin policies that conflict — if admin/staff read access was
-- previously granted via a different mechanism (e.g. RLS disabled, or
-- a service-role-only setup), these two policies are additive and
-- shouldn't remove anything that already worked. If admin's own
-- booking view stops working after this, tell me and I'll adjust.

-- To make someone a collector: same pattern as staff/admin/developer —
-- add them in Authentication -> Users, then set their staff_profiles
-- row's role to 'collector'. No 2FA required for this role (only admin
-- and developer need it).
