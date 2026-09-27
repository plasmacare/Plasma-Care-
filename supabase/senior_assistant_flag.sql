-- Run this once in the Supabase SQL editor.
-- Adds the on/off switch for the Senior Citizen Assistant feature
-- (homepage prompt, guided tutorial mode, and the voice/guided booking
-- assistant) to the existing site_settings singleton row, alongside the
-- maintenance-mode flags. Controlled from Developer panel -> Settings.

alter table site_settings add column if not exists senior_assistant_enabled boolean not null default false;
