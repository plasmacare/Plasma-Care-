-- Run once in the Supabase SQL editor.
-- On/off switch for the Firebase-backed customer account page. Controlled
-- from Developer panel -> Settings -> "Customer Accounts (Firebase)".
-- Off by default: nothing about accounts shows to customers until a
-- developer turns it on (after the Firebase setup in docs/FIREBASE_SETUP.md).

alter table site_settings add column if not exists customer_accounts_enabled boolean not null default false;
