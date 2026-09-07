-- Run in Supabase SQL editor.
-- Adds per-surface maintenance toggles to the existing single-row
-- site_settings table. Developer panel (Dev Pulse) is the only place
-- that writes these.

alter table site_settings
  add column if not exists maintenance_customer boolean not null default false,
  add column if not exists maintenance_staff boolean not null default false,
  add column if not exists maintenance_b2b boolean not null default false,
  add column if not exists maintenance_message text;

-- Admin and staff already have update access to this table (the Views
-- tab already writes to it for the animation-quality setting) — no
-- additional policy needed for these new columns.
