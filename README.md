# Plasma Care — Customer Booking App

React + Vite + Supabase. Pathology booking flow (home collection or lab visit),
date-only scheduling, OTP verification (NinzaSMS + 2Factor), and an optional
prescription-photo upload for anyone unsure which tests to pick. Other 5
services are shown as "Coming Soon".

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Build for hosting

```bash
npm run build
```
This creates a `dist/` folder — upload/deploy that to Vercel, Netlify, Hostinger, etc.
(For Vercel/Netlify: just connect the repo, they auto-detect Vite and run `npm run build`.)

## Environment variables

Already filled in `.env` for this project. If you deploy to Vercel/Netlify, add the
same 3 variables in their dashboard's "Environment Variables" section:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPPLS_API_KEY`

## Database setup

Run these once in the Supabase SQL Editor, in this order (skip any you've
already run for the admin panel):

1. `supabase/fix_public_access.sql` — public (non-logged-in) read/write
   access this app needs on packages, tests, bookings, and addresses.
2. `supabase/patient_details.sql` — patient name/age/gender/blood group
   fields, collected right after OTP verification.
3. `supabase/prescription_and_no_slots.sql` — prescription photo upload
   fields + storage bucket, and makes `slot_id` nullable (booking is
   date-only now, no time slot).

`supabase/slot_capacity_functions.sql` is no longer needed for new
setups — it's left in place only because older deployments may already
depend on it.

## OTP setup (NinzaSMS + 2Factor)

See `supabase/DEPLOY_OTP.md` for the full walkthrough. Short version:

- Default send, and "Resend via WhatsApp" / "Resend via SMS" → **NinzaSMS**
- "Get OTP via Call instead" → **2Factor** (kept only for this, since
  Ninza has no voice route)

Both API keys are Edge Function secrets — never in this frontend app.

## What's here

- **My Account** (`/account`) — a customer who's completed OTP once on
  this device is auto-logged-in (their phone number is remembered
  locally); from Home, tap "My Account" to see booking history and any
  uploaded report. On a new device, they verify their phone via OTP again
  to pull up their history — no password, no separate signup step.
- **Patient details** — right after OTP verification, the flow asks for
  the patient's name, age, gender, and blood group (the patient may not
  be the same person who booked). Can be skipped and filled in later.
- **Prescription photo upload** — on the test-selection step, anyone
  unsure which tests their doctor wrote down can upload a photo instead
  of picking tests manually. It's compressed in-browser before upload
  (resized + re-encoded as JPEG) so it doesn't eat into storage or take
  forever on a slow connection. The admin panel shows the photo and lets
  staff note down what it says.
- **Date-only scheduling** — no time slot picker; the confirmation screen
  tells the customer the collection window (6:00 AM – 9:00 PM) and that
  staff will call to confirm an exact time.

## Mappls note

If the address search box returns no results (401 error in browser console),
check your Mappls Console under "REST APIs" — Autosuggest sometimes needs a
separate REST key from the Web SDK key. Reverse geocode (the pin-drop address)
uses the same static key and should work as-is.

## What's next

1. Staff panel (separate app) — home-visit & in-store task views
2. Confirm the NinzaSMS request/response shape against their docs once
   there's real delivery volume (see `supabase/DEPLOY_OTP.md`)
