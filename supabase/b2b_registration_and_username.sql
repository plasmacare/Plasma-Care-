-- Run this once in the Supabase SQL editor.

-- B2B "Add Registration" no longer asks for a date — staff call to
-- confirm the actual collection date/time. Adds an optional free-text
-- time preference instead (e.g. "mornings before 10 AM").
alter table b2b_bulk_requests
  add column if not exists preferred_time text;

-- Defensive: make sure a booking can be created without a scheduled
-- date (B2B registrations no longer supply one up front).
alter table bookings
  alter column scheduled_date drop not null;

-- B2B "Request Access" form: a chosen username, checked for uniqueness
-- live as the company types (this is a business-facing identifier
-- shown in their account section — login itself stays email-based via
-- Supabase Auth, this does not change that).
alter table b2b_requests
  add column if not exists username text;

alter table b2b_accounts
  add column if not exists username text;

create unique index if not exists b2b_requests_username_idx on b2b_requests (lower(username)) where username is not null;
create unique index if not exists b2b_accounts_username_idx on b2b_accounts (lower(username)) where username is not null;

-- Public needs to check username availability while filling the form —
-- a narrow function that only ever returns true/false is used instead
-- of a broad SELECT policy, so this never exposes company names,
-- emails, phone numbers, or anything else in either table to the
-- public.
create or replace function is_b2b_username_available(check_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from b2b_requests where lower(username) = lower(check_username)
    union all
    select 1 from b2b_accounts where lower(username) = lower(check_username)
  );
$$;

grant execute on function is_b2b_username_available(text) to anon, authenticated;
