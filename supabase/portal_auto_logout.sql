-- Run once in the Supabase SQL editor.
-- Developer panel -> Settings -> "Portal auto-logout" controls whether
-- Staff, B2B, Admin and Developer panels sign out after inactivity, and
-- after how many minutes. Customer account auto-logout is separate and
-- always on.

alter table site_settings
  add column if not exists portal_auto_logout_enabled boolean not null default true,
  add column if not exists portal_auto_logout_minutes integer not null default 15;

alter table site_settings drop constraint if exists portal_auto_logout_minutes_check;
alter table site_settings
  add constraint portal_auto_logout_minutes_check
  check (portal_auto_logout_minutes in (5, 10, 15, 30, 60));
