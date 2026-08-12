# OTP Setup — NinzaSMS + 2Factor

The `send-otp` edge function uses two providers:

- **NinzaSMS** — default SMS, and the "Resend via WhatsApp" / "Resend via
  SMS" options.
- **2Factor** — kept alive just for "Get OTP via Call instead", since
  Ninza doesn't offer a voice route.

`verify-otp` is unchanged — OTPs are generated and checked in our own
`otp_verifications` table regardless of which provider delivered them, so
no changes were needed there.

## Deploy the function

```bash
supabase functions deploy send-otp
```

## Set the secrets (Supabase Dashboard → Edge Functions → send-otp → Secrets, or CLI)

```bash
supabase secrets set NINZA_API_KEY=NINZASMS018a302b158f3a76a2d21765e23558a27c11e0d74f1bdc67cbff
supabase secrets set NINZA_SENDER_ID=16046
supabase secrets set TWO_FACTOR_API_KEY=your_existing_2factor_key
```

(`TWO_FACTOR_API_KEY` should already be set from before — only add it
again if you're deploying to a fresh project.)

## Add credit to Ninza

The dashboard screenshot showed a ₹5.00 balance — that's enough for a
handful of test messages only. Add credit before relying on this in
production, or OTPs will start failing with a 402 (insufficient balance)
once it runs out.

## If SMS/WhatsApp delivery fails

Check the Ninza dashboard → **OTP Records** — it'll show whether the
request reached them and what they did with it. If the request never
shows up there at all, the API key or sender ID secret is likely wrong.
