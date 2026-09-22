-- Run this once in the Supabase SQL editor.
-- Backs the scrolling "New feature" ticker shown at the top of the
-- staff/admin panel (below the header) for 24 hours after a new
-- feature (not a bug fix) ships. Reads always filter to the last 24
-- hours client-side/query-side, so nothing needs to be cleaned up —
-- old rows just stop showing, though you can periodically delete them.

create table if not exists feature_announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now()
);

alter table feature_announcements enable row level security;

drop policy if exists "Staff can read feature announcements" on feature_announcements;
create policy "Staff can read feature announcements"
  on feature_announcements for select
  to authenticated
  using (true);

drop policy if exists "Staff can manage feature announcements" on feature_announcements;
create policy "Staff can manage feature announcements"
  on feature_announcements for all
  to authenticated
  using (true)
  with check (true);
