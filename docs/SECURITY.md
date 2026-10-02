# Security overview

## What is protected, and how
| Area | Protection |
|---|---|
| Customer accounts | Firebase Auth (email+password with a strong-password policy, or Google); email must be **verified** before any data is accessible; session lives only in the tab (closing it signs out); **auto sign-out after 10 min idle** (with a 60 s warning); sensitive actions (delete account) re-ask for the password / Google; wrong-password speed-bump + Firebase's server-side throttling; generic error messages so the form can't reveal which emails exist |
| Customer data | Firestore rules (`firebase/firestore.rules`): own-data-only, verified email only, every field whitelisted/type-checked/size-limited, anything else denied. No offline caching of health data in the browser |
| Bots / copied front-ends | Firebase **App Check** (reCAPTCHA v3), Cloudflare Turnstile on booking & B2B forms |
| Staff / admin / developer / B2B portal | Supabase Auth + Row Level Security (unchanged); admin & developer already require TOTP 2FA; **new: auto sign-out after 15 min of inactivity** (60 s warning; also signs out a stale restored session) |
| Injected-script (XSS) damage | Production build ships a **Content-Security-Policy** (allow-list of exactly the services the site uses; no inline scripts except hashed ones; no plugins/objects) |
| Clickjacking | Anti-frame script in `index.html` (hides the page and breaks out if framed) |
| Transport | HTTPS is enforced by GitHub Pages |

## What a static site cannot do (honest limits)
This site is static files on GitHub Pages and the free Firebase plan has no server code, so it **cannot**
set real HTTP security headers (HSTS, `frame-ancestors`, `X-Content-Type-Options`, `Permissions-Policy`),
run a fraud-detection engine, or lock out an attacker at a firewall the way a bank does. It also cannot
make front-end code secret — security rests on server-side rules (Supabase RLS, Firestore rules), never
on hiding things in JavaScript.

### To get the remaining header-level protections (free)
Put **Cloudflare (free plan)** in front of your domain (needs your own domain name rather than
`*.github.io`). Then add a Transform Rule → Modify Response Header:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Content-Security-Policy: frame-ancestors 'none'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), geolocation=(self), microphone=(self)
```
and enable Cloudflare's WAF managed rules + Bot Fight Mode + "Always Use HTTPS".

## Adding a new outside service later
The CSP is in `vite.config.js` (`contentSecurityPolicy`). If you start using a new API/CDN and the
browser console shows "Refused to connect/load ... Content Security Policy", add that address to the
matching list there.

## Regular housekeeping
- Review Firebase **Authentication → Users** and Supabase **Authentication** occasionally; disable accounts you don't recognise.
- Keep dependencies updated (`npm audit`, Dependabot).
- Never put service-role keys / secret keys in `VITE_*` variables — they are public in the built site.
