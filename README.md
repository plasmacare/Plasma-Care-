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
