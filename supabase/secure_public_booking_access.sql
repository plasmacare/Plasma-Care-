-- ============================================================
-- SECURITY FIX: remove blanket public read/write access to
-- bookings + addresses, replace with two narrow RPC functions
-- that only ever touch ONE row (the one whose id the caller
-- already knows), never the whole table.
--
-- Why: fix_public_access.sql gave the anon role (the public key
-- baked into every browser) "using (true)" SELECT on bookings
-- AND addresses, and "using (true) with check (true)" UPDATE on
-- bookings. That means anyone — no login needed — could call the
-- Supabase REST API directly and read EVERY customer's name,
-- phone, home address, and patient health details (name, age,
-- gender, blood group), and could overwrite ANY booking's status/
-- payment fields, not just their own.
--
-- Run this once in the Supabase SQL editor, AFTER deploying the
-- updated booking.js / payment.js / ReportView.jsx (below) that
-- call these functions instead of querying the tables directly.
-- ============================================================

-- 1. Remove the dangerous blanket policies -----------------------------
drop policy if exists "Public can read bookings" on bookings;
drop policy if exists "Public can verify bookings" on bookings;
drop policy if exists "Public can read addresses" on addresses;
-- "Public can create bookings" / "Public can create addresses" (INSERT,
-- with check (true)) are left as-is: creating a brand-new blind row
-- doesn't leak anything, and the booking flow still needs it.

-- 2. Read one booking by id — safe, curated column list only ----------
-- Excludes internal/staff-only fields (customer_ip, admin_notes,
-- assigned_staff, call_status, is_spam, prescription_notes, etc.) even
-- if more get added later, since this is an explicit allow-list.
create or replace function rpc_get_booking(p_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', b.id,
    'customer_name', b.customer_name,
    'total_amount', b.total_amount,
    'status', b.status,
    'report_url', b.report_url,
    'report_status', b.report_status,
    'payment_status', b.payment_status,
    'payment_method', b.payment_method,
    'payment_link', b.payment_link,
    'payment_requested_amount', b.payment_requested_amount,
    'payment_screenshot_url', b.payment_screenshot_url
  )
  from bookings b
  where b.id = p_id;
$$;

grant execute on function rpc_get_booking(uuid) to anon, authenticated;

-- 3. Patch one booking by id — only the specific customer-facing
-- fields the app is allowed to touch, nothing else. Uses `p_patch ?
-- 'key'` (key-presence check) rather than coalesce, so passing an
-- explicit null still clears a field (needed by
-- savePrescriptionUploadError) instead of silently being ignored.
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

-- ---- Verify after running ----
-- select proname from pg_proc where proname in ('rpc_get_booking','rpc_patch_booking');
-- select policyname from pg_policies where tablename in ('bookings','addresses');
--   (should no longer list "Public can read bookings", "Public can
--    verify bookings", or "Public can read addresses")
