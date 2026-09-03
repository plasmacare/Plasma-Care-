# Plasma Care — Merged Site (Customer + Staff/Admin + B2B)

Ab ek hi repo/deployment hai. Customer-facing site (Home, booking flow)
bilkul pehle jaisa hai — koi change nahi. Staff/Admin panel aur naya B2B
portal `/portal/*` ke peeche lazy-loaded hain, isliye normal customer ka
bundle bada nahi hua.

## Kya kaha se aaya

| Route | Kya hai |
|---|---|
| `/` | Customer site (unchanged) |
| `/portal/login` | Sabka single login — role se decide hota hai kahan bhejna hai |
| `/portal/request-access` | B2B ke liye public request form |
| `/portal/mfa/enroll`, `/portal/mfa/verify` | Admin ka 2FA (sirf role=admin ko dikhega) |
| `/portal/staff/*` | Staff/Admin panel (purana Admin--main ka poora content yahan move hua) |
| `/portal/b2b/*` | Naya B2B portal — Dashboard, Bulk Add, History |

Home page par top-right mein ek naya **"Portal Login"** dropdown/drawer
hai jisme B2B login, Request Access, aur Staff/Admin login teeno milte
hain.

## Setup — order se karo

1. **SQL** (Supabase SQL editor mein, isi order mein):
   - `supabase/role_based_single_login.sql` (agar pehle se run nahi kiya)
   - `supabase/b2b_and_bulk_requests.sql`
2. **Bootstrap admin**: `role_based_single_login.sql` ke andar comment
   mein di gayi query se apne existing admin ko `role='admin'` set karo
   (agar pehle se nahi kiya).
3. **Edge function deploy** (B2B approve button ke kaam karne ke liye):
   ```
   supabase functions deploy approve-b2b-request
   ```
   Isko koi extra secret nahi chahiye — `SUPABASE_URL` aur
   `SUPABASE_SERVICE_ROLE_KEY` Supabase khud provide karta hai.
4. **2FA confirm karo**: Supabase Dashboard → Authentication → Providers
   → Multi-Factor Authentication → Authenticator App **ON** hona chahiye
   (default mein on hota hai, bas confirm kar lo).
5. `.env` mein wahi `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` daalo
   jo customer site already use kar raha tha (same project).
6. `npm install && npm run build`

## Flow — B2B

1. Koi bhi `/portal/request-access` form bharta hai (login ki zarurat
   nahi) → `b2b_requests` table mein pending row ban jaati hai.
2. Admin panel → **B2B Requests** tab → Approve.
3. Edge function real Supabase Auth login banata hai + unko email se
   invite bhejta hai (password set karne ka link).
4. Wo `/portal/login` se login karke `/portal/b2b` pe land karte hain.
5. **Bulk Add**: package/test select karo, patients ek line mein
   `Name, Age, Gender, Phone` format mein paste karo, submit karo.
   Ye `b2b_bulk_requests` table mein jaata hai — staff ise dekh ke
   real bookings mein convert karte hain (jaan-boojh kar seedha
   `bookings` table mein force nahi kiya, taaki uske existing
   scheduling rules na tootein).

## Flow — Admin 2FA

Pehli baar admin login karega → seedha QR-code enroll screen pe jayega
(Authenticator app se scan karna hoga). Uske baad har login pe 6-digit
code maangega. Staff/B2B roles ke liye 2FA zaroori nahi hai.

## Android build

`viewport-fit=cover` + safe-area CSS (`env(safe-area-inset-*)`) already
lagi hui hai poori site mein — jab Android WebView/TWA mein wrap karoge,
status bar/nav bar content ko crop nahi karega. Desktop pe koi effect
nahi (env values 0 rehte hain).

## Note

Purana `Admin--main` repo ab standalone deploy karne ki zarurat nahi —
sab kuch is ek repo mein aa gaya hai. Purana repo backup ke liye rakh
sakte ho, bas use production mein deploy mat karna (do jagah alag-alag
update hone se confusion hoga).

## Update — Dev Pulse, dropdown nav, Views fix

1. **Run one more SQL file**: `supabase/activity_logs.sql` (after the
   other two).
2. **Create the developer account**: same as staff — add a user in
   Supabase Authentication → Users, then in `staff_profiles` set their
   `role` to `developer` (Table Editor, same way you promoted admin).
   They'll go through the same 2FA enroll flow as admin on first login.
3. Dev Pulse lives at `/portal/dev` — it is **not** a tab inside the
   staff panel, and admin cannot open it either (`requireRole` on the
   route checks for exactly `role = 'developer'`).
4. The AI Packages tab is removed from the staff panel; replaced by the
   Dev Pulse activity/error feed. The old `AiPackagesTab.jsx` file is
   still in the repo but unused — safe to delete later if you don't
   need it back.
5. Fixed: opening the Views tab no longer crashes. The bug was the
   merge itself — customer site and admin panel were joining the same
   Supabase Realtime "site-viewers" channel in one browser tab. The
   customer-side analytics/presence code now only runs on non-`/portal`
   routes.
6. Staff/Admin panel tabs are now a dropdown (tap to open) instead of a
   horizontal scrolling row, so nothing gets cut off on narrow screens.

## What logEvent() covers right now

Automatic (needs no per-page work): every uncaught JS error/promise
rejection, anywhere on the site.

Manually instrumented so far: customer booking creation, staff/admin/B2B
login success+failure, B2B request submitted/approved/rejected, B2B bulk
request submitted, staff role changes. Add more over time by calling
`logEvent({ type, source, message, metadata })` from `src/lib/telemetry.js`
at any other action worth tracking (payment attempts, catalog edits,
report uploads, etc.) — same pattern everywhere.

## Update — Collection staff dispatch (Rapido-rider style)

1. **Run one more SQL file**: `supabase/collection_dispatch.sql` — adds
   `assigned_collector_id` and `collection_status` to `bookings`, plus
   RLS so a collector only sees/updates their own assigned bookings.
   **Read the note inside that file** — it depends on `bookings` RLS
   already being enabled with an existing admin/staff policy; if admin's
   booking view breaks after running it, tell me and I'll adjust.
2. **Create collector accounts**: same pattern as staff/admin/developer
   — add the person in Authentication → Users, then set their
   `staff_profiles.role` to `collector`. No 2FA needed for this role.
3. **Admin side**: in the Bookings tab, home-collection bookings now
   show a **Collection staff** dropdown instead of the old free-text
   field, listing active collectors with their current open-job count
   (so you can see who's free before assigning). Lab-visit bookings keep
   the old free-text field, since there's no rider workflow for those.
4. **Collector side**: `/portal/collector` — their own job list (Rapido-
   style cards): Accept/Decline a new assignment, then Start → Arrived →
   Mark Collected. Each card has Call and Navigate (opens Google Maps
   directions to the address) buttons. History tab shows past jobs.
   Not part of the staff panel — its own route, own dropdown-free UI.
5. Marking a job "Collected" also flips the booking's main `status` to
   `sample_collected`, so the existing report/payment flow downstream
   is untouched.

This covers the core Rapido-style loop (assign → accept → en route →
arrived → collected) plus call/navigate. Live GPS tracking of the
collector's position (so admin/patient sees them moving on a map in
real time, like Rapido does) is a meaningfully bigger feature — needs
background location permission, which really only works well from a
native Android wrapper rather than a browser tab — flagging it as a
natural next step rather than building a half-working version now.
