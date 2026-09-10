-- Run this once in the Supabase SQL editor.
--
-- FIX: collection agents couldn't see the pickup location on their
-- jobs. Root cause: the `addresses` table only ever had a SELECT
-- policy scoped `to anon` (from fix_public_access.sql, for the
-- customer-facing site) — there was never one for `authenticated`
-- users, so when a collector's own app queried addresses for their
-- assigned jobs, RLS silently returned zero rows. This adds that
-- missing policy: staff/admin can read any address (needed for the
-- Bookings tab's map preview), and a collector can read the address
-- for a booking assigned to them.

drop policy if exists "staff and collectors can read addresses" on addresses;
create policy "staff and collectors can read addresses"
  on addresses for select
  to authenticated
  using (
    current_staff_role() in ('admin', 'staff')
    or exists (
      select 1 from bookings
      where bookings.id = addresses.booking_id
        and bookings.assigned_collector_id = auth.uid()
    )
  );
