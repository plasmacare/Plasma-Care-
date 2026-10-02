# Security overview

## What is protected, and how
| Area | Protection |
|---|---|
| Customer accounts | Firebase Auth (email+password with a strong-password policy, or Google); email must be **verified** before any data is accessible; session lives only in the tab (closing it signs out); **auto sign-out after 10 min idle** (with a 60 s warning); sensitive actions (delete account) re-ask for the password / Google; wrong-password speed-bump + Firebase's server-side throttling; generic error messages so the form can't reveal which emails exist |
| Customer data | Firestore rules (`firebase/firestore.rules`): own-data-only, verified email only, every field whitelisted/type-checked/size-limited, anything else denied. No offline caching of health data in the browser |
| Bots / copied front-ends | Firebase **App Check** (reCAPTCHA v3), Cloudflare Turnstile on booking & B2B forms |
| Staff / admin / developer / B2B portal | Supabase Auth + Row Level Security (unchanged); admin & developer already require TOTP 2FA; **auto sign-out after inactivity — on/off and minutes set in Developer panel** (60 s warning; also signs out a stale restored session; offline cache wiped on login/logout) |
| Injected-script (XSS) damage | Production build ships a **Content-Security-Policy** (allow-list of exactly the services the site uses; no inline scripts except hashed ones; no plugins/objects) |
| Clickjacking | Real `X-Frame-Options` / `frame-ancestors` headers from Vercel, plus an anti-frame script in `index.html` as a backup |
| Transport | HTTPS + HSTS (Vercel) |

## Real security headers (Vercel) — `vercel.json`
Vercel lets us send genuine HTTP headers, which GitHub Pages cannot. They are set for every page:
| Header | Why |
|---|---|
| `Strict-Transport-Security` | browser only ever uses HTTPS for this site for 2 years |
| `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` | nobody can frame the site (clickjacking) |
| `X-Content-Type-Options: nosniff` | stops the browser guessing file types |
| `Referrer-Policy` | doesn't leak full URLs to other sites |
| `Permissions-Policy` | only the mic (voice input / Odia recorder), location (map) and camera are allowed; payment, USB, Bluetooth, sensors are off |
| `Cross-Origin-Opener-Policy: same-origin-allow-popups` | isolates the page but still lets Google sign-in open its popup |
| CSP `object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests` | no plugins, no tag-hijacking, no forms posting elsewhere, no http |
| `Cache-Control` | the page and service worker are always re-checked; hashed assets are cached for a year |

The rest of the Content-Security-Policy (which scripts/APIs/images are allowed) is built into the page by
`vite.config.js` because it needs per-build script hashes. Both policies are enforced together.

## Portal sessions
- Staff, B2B, Admin and Developer panels: auto-logout is switched on/off and timed (5–60 min) from
  **Developer panel → Settings → Portal auto-logout**. If the setting can't be read, it falls back to ON / 15 min.
- The customer account page always auto-logs-out after 10 minutes (not configurable).
- The portal's offline cache of booking lists (names, phone numbers) is wiped on every login and logout, so
  nothing is left behind on a shared phone or computer.
- Admin and Developer logins already require 2-step verification (authenticator app).

## What this still cannot do (honest limits)
A bank runs its own servers, fraud-detection engine, network firewalls, hardware security modules and a
24x7 security team. A site on Vercel + Supabase + Firebase can't copy those parts. Instead it relies on the
providers' secured infrastructure plus server-side rules: Supabase Row Level Security, Firestore rules and
App Check. Front-end code is never secret, so nothing sensitive is ever protected only by JavaScript.

### Switch these on in the dashboards (free, no code)
**Supabase → Authentication**
- Providers → Email: **minimum password length 10+**, require upper/lower/number/symbol, enable
  **leaked-password protection** (Pro plan feature; skip if on free).
- Attack Protection: enable **CAPTCHA** (Cloudflare Turnstile) for sign-in; keep rate limits low.
- Sessions: set **inactivity timeout** / time-box sessions (Pro plan) if available.
- URL configuration: Site URL = your Vercel address; remove any URLs you don't use.
- Multi-factor: make sure TOTP is enabled (the app already enforces it for admin/developer).

**Vercel**
- Project → Settings → **Deployment Protection**: protect Preview deployments (Vercel Authentication) so
  half-finished builds aren't public.
- Settings → Security: turn on the **Attack Challenge Mode** if you ever see abuse.
- Account → enable **2FA** on your Vercel and GitHub accounts, and protect the `main` branch (require a review).
- Environment variables: only `VITE_*` public values belong in the front-end; never add a service-role or secret key with a `VITE_` name.

**Firebase / Google**
- Enforce **App Check** for Firestore and Authentication (see `FIREBASE_SETUP.md`).
- Turn on **email enumeration protection** and the **password policy**.

**Your own domain (optional, later)**
A custom domain on Vercel (instead of `*.vercel.app`) lets you submit it to the HSTS preload list and gives
customers a more trustworthy address. Vercel's free firewall (WAF) rules can then add rate limits per IP.

## Adding a new outside service later
The CSP is in `vite.config.js` (`contentSecurityPolicy`). If you start using a new API/CDN and the
browser console shows "Refused to connect/load ... Content Security Policy", add that address to the
matching list there.

## Regular housekeeping
- Review Firebase **Authentication → Users** and Supabase **Authentication** occasionally; disable accounts you don't recognise.
- Keep dependencies updated (`npm audit`, Dependabot).
- Never put service-role keys / secret keys in `VITE_*` variables — they are public in the built site.
