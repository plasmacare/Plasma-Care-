# Plasma Care — Customer Booking App

React + Vite + Supabase. Pathology booking flow (home collection or lab visit),
with WhatsApp/Call OTP verification. Other 5 services are shown as "Coming Soon".

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

Run `supabase/slot_capacity_functions.sql` once in the Supabase SQL Editor
(if you haven't already for the admin panel). It adds two small functions
so a slot's booked-count updates atomically when a booking is made — this
is what stops two people from double-booking the same slot at the same time.

Also run `supabase/fix_public_access.sql` once — it restores the public
(non-logged-in) read/write access this app needs on packages, tests,
slots, bookings, and addresses, which got locked down when RLS was
enabled for the admin panel.

Also run `supabase/patient_details.sql` once — it adds the patient
name/age/gender/blood group fields collected right after OTP verification.

## What's new

- **My Account** (`/account`) — a customer who's completed OTP once on
  this device is auto-logged-in (their phone number is remembered
  locally); from Home, tap "My Account" to see booking history and any
  uploaded report. On a new device, they verify their phone via OTP again
  to pull up their history — no password, no separate signup step.
- **Patient details** — right after OTP verification, the flow now asks
  for the patient's name, age, gender, and blood group (the patient may
  not be the same person who booked). This can be skipped and filled in
  later by calling in.
- **IST-aware slot cutoffs** — a time slot for today automatically stops
  being offered once its start time has passed, based on real IST clock
  time (not the customer's device clock, which can't be trusted). The
  slot list also silently refreshes every minute while someone's on the
  date/slot step, so a slot that just crossed its cutoff disappears on
  its own.

Never put the Supabase **service_role** key or the 2Factor key in this app — they
must only live server-side (in the Edge Functions we build next).

## ⚠️ Not yet functional — needs the OTP backend

The booking flow calls `send-otp` and `verify-otp` — these are Supabase Edge
Functions that don't exist yet. That's the next build step: a small server-side
function that holds the 2Factor API key and actually sends/checks the WhatsApp
OTP. Until that's deployed, "Send OTP" will fail.

## Mappls note

If the address search box returns no results (401 error in browser console),
check your Mappls Console under "REST APIs" — Autosuggest sometimes needs a
separate REST key from the Web SDK key. Reverse geocode (the pin-drop address)
uses the same static key and should work as-is.

## What's next

1. Deploy `send-otp` / `verify-otp` Edge Functions (2Factor integration)
2. Admin panel (separate app) — bookings dashboard, staff assignment
3. Staff panel (separate app) — home-visit & in-store task views
