-- Run this once in the Supabase SQL editor.
-- Adds the on-call senior/supervisor number shown in the collector
-- app's Emergency panel — collectors escalate problems to their senior,
-- not a general staff line. Admin sets this from the Views tab (same
-- place the site-wide settings singleton row already lives).
alter table site_settings
  add column if not exists senior_contact_phone text;
