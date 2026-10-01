-- Run this once in the Supabase SQL editor.
--
-- 1. Hindi/Odia booking forms: the customer-facing form now converts
--    names/landmarks to English for staff, and keeps what the customer
--    actually typed in these *_original columns so staff can double-check.
-- 2. rpc_patch_booking is re-created with one extra allowed key
--    (patient_name_original). Everything else is identical to
--    secure_public_booking_access.sql.
--
-- Nothing here is required for bookings to keep working — until it's run,
-- English text saves exactly as before and the "as typed" originals are
-- simply not stored for Hindi/Odia entries.

alter table bookings
  add column if not exists customer_name_original text,
  add column if not exists patient_name_original text;

alter table addresses
  add column if not exists landmark_original text;

create or replace function rpc_patch_booking(p_id uuid, p_patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update bookings set
    prescription_url = case when p_patch ? 'prescription_url'
      then p_patch->>'prescription_url' else prescription_url end,
    prescription_upload_error = case when p_patch ? 'prescription_upload_error'
      then p_patch->>'prescription_upload_error' else prescription_upload_error end,
    patient_name = case when p_patch ? 'patient_name'
      then p_patch->>'patient_name' else patient_name end,
    patient_name_original = case when p_patch ? 'patient_name_original'
      then p_patch->>'patient_name_original' else patient_name_original end,
    patient_age = case when p_patch ? 'patient_age'
      then (p_patch->>'patient_age')::integer else patient_age end,
    patient_gender = case when p_patch ? 'patient_gender'
      then p_patch->>'patient_gender' else patient_gender end,
    patient_blood_group = case when p_patch ? 'patient_blood_group'
      then p_patch->>'patient_blood_group' else patient_blood_group end,
    prescription_ai_confidence = case when p_patch ? 'prescription_ai_confidence'
      then (p_patch->>'prescription_ai_confidence')::numeric else prescription_ai_confidence end,
    prescription_ai_summary = case when p_patch ? 'prescription_ai_summary'
      then p_patch->>'prescription_ai_summary' else prescription_ai_summary end,
    payment_requested_amount = case when p_patch ? 'payment_requested_amount'
      then (p_patch->>'payment_requested_amount')::numeric else payment_requested_amount end,
    payment_method = case when p_patch ? 'payment_method'
      then p_patch->>'payment_method' else payment_method end,
    payment_link = case when p_patch ? 'payment_link'
      then p_patch->>'payment_link' else payment_link end,
    payment_status = case when p_patch ? 'payment_status'
      then p_patch->>'payment_status' else payment_status end,
    razorpay_payment_link_id = case when p_patch ? 'razorpay_payment_link_id'
      then p_patch->>'razorpay_payment_link_id' else razorpay_payment_link_id end,
    payment_screenshot_url = case when p_patch ? 'payment_screenshot_url'
      then p_patch->>'payment_screenshot_url' else payment_screenshot_url end
  where id = p_id;
end;
$$;

grant execute on function rpc_patch_booking(uuid, jsonb) to anon, authenticated;

-- Also make sure these (from earlier updates) exist — harmless if already run:
alter table bookings add column if not exists customer_ip text;
alter table bookings add column if not exists booked_via_senior_assistant boolean not null default false;
