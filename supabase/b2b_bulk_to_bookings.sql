-- Run this once in the Supabase SQL editor.
--
-- A B2B bulk submission now creates real rows in `bookings` directly at
-- submission time (no separate admin "Accept" step — the company was
-- already vetted when their access request was approved). That's what
-- makes a B2B batch behave exactly like normal bookings afterward:
-- status workflow, collection-staff assignment, report generation —
-- and lets it show up in the same Bookings tab (color-coded, not a
-- separate queue).

alter table bookings
  add column if not exists b2b_bulk_request_id uuid references b2b_bulk_requests(id),
  add column if not exists b2b_account_id uuid references b2b_accounts(id);

create index if not exists bookings_b2b_bulk_request_idx on bookings (b2b_bulk_request_id);

-- Kept for history/record-keeping even though nothing manually flips it
-- anymore — submission sets both immediately.
alter table b2b_bulk_requests
  add column if not exists bookings_created boolean not null default false;

-- A B2B account creates its own batch of bookings directly (this is
-- the new part — previously only staff/admin could insert bookings).
drop policy if exists "b2b can create own bookings" on bookings;
create policy "b2b can create own bookings"
  on bookings for insert
  to authenticated
  with check (b2b_account_id = auth.uid());

-- Same for the address row each home-collection booking needs — the
-- company's own registered address/location, reused per employee.
drop policy if exists "b2b can create addresses for own bookings" on addresses;
create policy "b2b can create addresses for own bookings"
  on addresses for insert
  to authenticated
  with check (
    exists (
      select 1 from bookings
      where bookings.id = addresses.booking_id
      and bookings.b2b_account_id = auth.uid()
    )
  );

-- Staff/admin still need full read/update/create access for everything
-- (their own manual bookings, plus managing B2B-originated ones).
drop policy if exists "staff can create bookings" on bookings;
create policy "staff can create bookings"
  on bookings for insert
  to authenticated
  with check (current_staff_role() in ('admin', 'staff'));

drop policy if exists "staff can update any booking" on bookings;
create policy "staff can update any booking"
  on bookings for update
  to authenticated
  using (current_staff_role() in ('admin', 'staff'))
  with check (current_staff_role() in ('admin', 'staff'));

drop policy if exists "staff can read all bookings" on bookings;
create policy "staff can read all bookings"
  on bookings for select
  to authenticated
  using (current_staff_role() in ('admin', 'staff'));

-- Lets a B2B account see the live status/report link for bookings that
-- came from their own bulk submissions (shown in their History page).
drop policy if exists "b2b reads own converted bookings" on bookings;
create policy "b2b reads own converted bookings"
  on bookings for select
  to authenticated
  using (b2b_account_id = auth.uid());

-- ---------- Company location (point: request form now asks for it) ----------

alter table b2b_requests
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table b2b_accounts
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
