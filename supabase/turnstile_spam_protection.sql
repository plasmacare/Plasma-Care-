-- Run in Supabase SQL editor.
--
-- How this works: the customer/B2B form solves a Cloudflare Turnstile
-- challenge, sends the token to the new `verify-turnstile` edge
-- function, which checks it with Cloudflare using the SECRET key
-- (server-side only, never in the browser) and — only if genuine —
-- creates a short-lived, one-time-use row here. The booking/request
-- insert is only allowed if it references a valid, unused,
-- not-yet-expired row from this table. A bot that never solves the
-- challenge has no way to get a `verification_id`, so its insert is
-- rejected by RLS itself, not just hidden by a nicer UI.

create table if not exists verified_submissions (
  id uuid primary key default gen_random_uuid(),
  purpose text not null, -- 'booking' | 'b2b_request'
  used boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table verified_submissions enable row level security;

-- No one can INSERT here except the edge function (which uses the
-- service-role key and bypasses RLS entirely) — so no policy grants
-- insert to anon/authenticated on purpose.

-- Anon/authenticated need to be able to check "does this id exist and
-- qualify" from within the bookings/b2b_requests INSERT policies below.
-- The id itself is an unguessable random UUID that only ever reaches a
-- browser that just passed Turnstile, so this is safe despite being a
-- broad-looking `using (true)`.
drop policy if exists "anyone can check a verification id" on verified_submissions;
create policy "anyone can check a verification id"
  on verified_submissions for select
  to anon, authenticated
  using (true);

-- ---------- bookings ----------

alter table bookings add column if not exists verification_id uuid references verified_submissions(id);

drop policy if exists "Public can create bookings" on bookings;
create policy "Public can create bookings" on bookings
  for insert to anon
  with check (
    exists (
      select 1 from verified_submissions vs
      where vs.id = verification_id
      and vs.purpose = 'booking'
      and vs.used = false
      and vs.expires_at > now()
    )
  );

-- addresses ride on the parent booking's verification — no separate
-- token needed, but it must point at a booking that was itself verified.
drop policy if exists "Public can create addresses" on addresses;
create policy "Public can create addresses" on addresses
  for insert to anon
  with check (
    exists (
      select 1 from bookings b
      where b.id = booking_id
      and b.verification_id is not null
    )
  );

-- Burns the token the instant it's used, so it can never create a
-- second booking even if the browser replays the same request.
create or replace function mark_verification_used()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_id is not null then
    update verified_submissions set used = true where id = new.verification_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_booking_verified on bookings;
create trigger on_booking_verified
  after insert on bookings
  for each row execute function mark_verification_used();

-- ---------- b2b_requests ----------

alter table b2b_requests add column if not exists verification_id uuid references verified_submissions(id);

drop policy if exists "anyone can submit a request" on b2b_requests;
create policy "anyone can submit a request"
  on b2b_requests for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from verified_submissions vs
      where vs.id = verification_id
      and vs.purpose = 'b2b_request'
      and vs.used = false
      and vs.expires_at > now()
    )
  );

drop trigger if exists on_b2b_request_verified on b2b_requests;
create trigger on_b2b_request_verified
  after insert on b2b_requests
  for each row execute function mark_verification_used();

-- Housekeeping: old rows (used or simply expired) can be pruned
-- whenever convenient — same idea as the activity_logs pruning script.
-- delete from verified_submissions where created_at < now() - interval '1 day';
