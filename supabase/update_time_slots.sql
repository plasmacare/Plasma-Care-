-- ============================================================
-- TIME SLOTS REBUILD — clinic hours 6 AM to 9 PM, 1-hour slots
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop the old date-specific slot design (it required pre-generating
-- rows per date). New design: time_slots is a reusable DAILY TEMPLATE
-- (15 rows, one per hour, 06:00–21:00). Availability for a specific
-- date is computed by counting existing bookings for that date+slot,
-- not by a stored counter — so no cron job is needed to pre-populate
-- future dates.

alter table bookings drop constraint if exists bookings_slot_id_fkey;
drop table if exists time_slots cascade;

create table time_slots (
  id uuid primary key default gen_random_uuid(),
  start_time time not null,
  end_time time not null,
  max_capacity int not null default 10,  -- 0 = unlimited (admin can set this)
  is_active boolean not null default true,
  sort_order int not null,
  created_at timestamptz default now(),
  unique(start_time)
);

alter table bookings
  add constraint bookings_slot_id_fkey foreign key (slot_id) references time_slots(id);

alter table time_slots enable row level security;

create policy "public read active time slots" on time_slots
  for select using (is_active = true);

-- Generate 15 one-hour slots: 06:00-07:00 through 20:00-21:00
insert into time_slots (start_time, end_time, max_capacity, sort_order)
select
  (time '06:00' + (n || ' hours')::interval)::time as start_time,
  (time '07:00' + (n || ' hours')::interval)::time as end_time,
  10 as max_capacity,
  n as sort_order
from generate_series(0, 14) as n;
