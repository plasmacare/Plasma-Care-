-- Run in Supabase SQL editor (same project). Adds the B2B side: a public
-- "Request Access" form, an admin approval queue, and a bulk-request
-- staging table B2B clients use once approved.

-- 1. Public request form submissions — anyone can insert, nobody can read
-- except admin (prevents one company snooping on another's request).
create table if not exists b2b_requests (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  gstin text,
  address text,
  message text,
  status text not null default 'pending', -- pending | approved | rejected
  reviewed_by uuid references staff_profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table b2b_requests enable row level security;

drop policy if exists "anyone can submit a request" on b2b_requests;
create policy "anyone can submit a request"
  on b2b_requests for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admin reads and manages requests" on b2b_requests;
create policy "admin reads and manages requests"
  on b2b_requests for all
  to authenticated
  using (current_staff_role() = 'admin')
  with check (current_staff_role() = 'admin');

-- 2. Approved B2B accounts. A row here only exists once admin approves —
-- id is filled in by the approve-b2b-request edge function after it
-- creates the Supabase Auth login and invites the user by email.
create table if not exists b2b_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  request_id uuid references b2b_requests(id),
  email text not null,
  company_name text not null,
  contact_name text not null,
  phone text not null,
  gstin text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table b2b_accounts enable row level security;

drop policy if exists "b2b reads own account" on b2b_accounts;
create policy "b2b reads own account"
  on b2b_accounts for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "admin manages b2b accounts" on b2b_accounts;
create policy "admin manages b2b accounts"
  on b2b_accounts for all
  to authenticated
  using (current_staff_role() = 'admin')
  with check (current_staff_role() = 'admin');

-- 3. Bulk requests — a B2B account submits a batch of patients here.
-- Kept separate from the live `bookings` table on purpose: staff convert
-- each into a real booking (with a proper scheduled date/slot) rather
-- than bulk-inserting straight into bookings, which avoids breaking
-- whatever NOT NULL/slot-capacity rules that table already enforces.
create table if not exists b2b_bulk_requests (
  id uuid primary key default gen_random_uuid(),
  b2b_account_id uuid not null references b2b_accounts(id) on delete cascade,
  package_id uuid references packages(id),
  individual_test_id uuid references individual_tests(id),
  preferred_date date,
  patients jsonb not null, -- [{name, age, gender, phone}, ...]
  status text not null default 'submitted', -- submitted | processing | completed | cancelled
  notes text,
  created_at timestamptz not null default now()
);

alter table b2b_bulk_requests enable row level security;

drop policy if exists "b2b manages own bulk requests" on b2b_bulk_requests;
create policy "b2b manages own bulk requests"
  on b2b_bulk_requests for all
  to authenticated
  using (b2b_account_id = auth.uid())
  with check (b2b_account_id = auth.uid());

drop policy if exists "staff read all bulk requests" on b2b_bulk_requests;
create policy "staff read all bulk requests"
  on b2b_bulk_requests for select
  to authenticated
  using (current_staff_role() in ('admin', 'staff') or current_staff_role() is not null);

drop policy if exists "admin updates bulk requests" on b2b_bulk_requests;
create policy "admin updates bulk requests"
  on b2b_bulk_requests for update
  to authenticated
  using (current_staff_role() = 'admin')
  with check (current_staff_role() = 'admin');

-- NOTE: b2b_bulk_requests.b2b_account_id = auth.uid() only works because
-- b2b_accounts.id IS the auth.uid() (same uuid, set by the edge function).

-- 4. Admin MFA: no table needed — Supabase Auth's built-in TOTP MFA
-- handles factor storage internally. Just confirm it's on: Supabase
-- Dashboard -> Authentication -> Providers -> Multi-Factor Authentication
-- -> Authenticator App should already be enabled by default. If it's
-- toggled off there, turn it on — the app-side enroll/verify code in
-- this build assumes it's available.
