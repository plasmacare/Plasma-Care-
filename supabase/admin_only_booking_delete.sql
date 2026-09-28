-- Run this once in the Supabase SQL editor.
-- Replaces the earlier "any logged-in user can delete bookings" policy
-- (allow_booking_delete.sql) so ONLY admins can delete bookings —
-- individually or in bulk. Hiding the button in the staff panel alone
-- isn't enough on its own: this is the rule the database itself enforces.

drop policy if exists "Admins can delete bookings" on bookings;
create policy "Admins can delete bookings"
  on bookings for delete
  to authenticated
  using (current_staff_role() = 'admin');

drop policy if exists "Admins can delete addresses" on addresses;
create policy "Admins can delete addresses"
  on addresses for delete
  to authenticated
  using (current_staff_role() = 'admin');
