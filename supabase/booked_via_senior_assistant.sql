-- Run this once in the Supabase SQL editor.
-- Marks bookings made through the Senior Citizen guided assistant so the
-- admin panel can label them "Booked by senior citizen" and staff know
-- to expect a customer who may need extra patience/clarity on the call.

alter table bookings add column if not exists booked_via_senior_assistant boolean not null default false;
