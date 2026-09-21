-- Run this once in the Supabase SQL editor.
-- Records which staff member assigned a collection partner to a
-- home-collection booking (shown in the admin panel next to the
-- "Collection staff" field). Cleared automatically whenever a booking
-- is unassigned.

alter table bookings add column if not exists assigned_collector_by text;
