-- Run this once in the Supabase SQL editor.
--
-- Lets staff "Accept" a B2B bulk order and have each patient in it
-- become a real row in `bookings` — the same table normal customer
-- bookings live in. That's what makes the Bulk Orders view behave like
-- the normal Bookings page (status workflow, collection assignment,
-- and — since it's now a real booking — the "Generate report" button
-- from the lab-report feature works for B2B patients too, no separate
-- report feature needed for the B2B side).

alter table bookings
  add column if not exists b2b_bulk_request_id uuid references b2b_bulk_requests(id),
  add column if not exists b2b_account_id uuid references b2b_accounts(id);

create index if not exists bookings_b2b_bulk_request_idx on bookings (b2b_bulk_request_id);

-- Tracks whether a bulk order has already been converted, so re-opening
-- it (or accidentally clicking twice) never creates duplicate bookings.
alter table b2b_bulk_requests
  add column if not exists bookings_created boolean not null default false;

-- There wasn't a general "staff can create/update any booking" policy
-- on file (only the narrow collector-scoped update, and the public/anon
-- policies the customer site uses) — adding one explicitly rather than
-- assuming an undocumented policy already covers this on your project.
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

-- Lets a B2B account see the report status/download link for bookings
-- that came from their own converted bulk orders (shown in their
-- History page) — without this they'd only see their original
-- submission, not what happened to it afterward.
drop policy if exists "b2b reads own converted bookings" on bookings;
create policy "b2b reads own converted bookings"
  on bookings for select
  to authenticated
  using (b2b_account_id = auth.uid());
