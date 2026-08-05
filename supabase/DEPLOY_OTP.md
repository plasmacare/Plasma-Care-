# Deploying the OTP Edge Functions

These run on Supabase's servers, not in the browser — this is where the
2Factor API key lives safely.

## 1. Install Supabase CLI (one-time)
```bash
npm install -g supabase
```

## 2. Login and link this project
```bash
supabase login
supabase link --project-ref pfkiukwzfwdsdswfvfuk
```
(Project ref is the part of your Supabase URL before `.supabase.co`)

## 3. Set the 2Factor API key as a secret (never in code)
```bash
supabase secrets set TWO_FACTOR_API_KEY=2503bcf6-237e-11f1-bcb0-0200cd936042
```

## 4. Deploy both functions
```bash
supabase functions deploy send-otp
supabase functions deploy verify-otp
```

## 5. Lock down the OTP table
Run `tighten_otp_rls.sql` in the Supabase SQL Editor — this removes the
now-unneeded public access to `otp_verifications` since only the Edge
Functions touch it from here on.

## 6. Test it
From the customer app's booking flow: Details step → Send OTP → check your
WhatsApp. If nothing arrives, check the function logs:
```bash
supabase functions logs send-otp
```

## About the WhatsApp endpoint

The `send-otp` function calls 2Factor's WhatsApp OTP endpoint using a
best-guess URL pattern. 2Factor's exact WhatsApp integration depends on a
template you approve in their dashboard (under "WhatsApp API" / "Addon
Services") — **log into your 2Factor dashboard and check the exact code
snippet they show for your account**. If it differs from what's in
`send-otp/index.ts`, update that one `sendViaWhatsapp` function — everything
else (OTP storage, verification, expiry) stays the same.

As a safety net, if the WhatsApp call fails, the function automatically
falls back to SMS — so booking flow won't get stuck even if the WhatsApp
endpoint needs adjusting.
