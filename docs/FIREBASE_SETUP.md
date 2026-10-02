# Firebase setup — customer accounts (free Spark plan)

Firebase is used **only** for the customer "My Account" page. Supabase stays the primary
database, Cloudinary stays the home of reports. Everything below is free on the Spark plan.
Do the steps in order; the whole thing takes about 20 minutes.

## 1. Create the project
1. https://console.firebase.google.com → **Add project** → name it (e.g. `plasma-care-accounts`).
   Google Analytics: you can turn it OFF.
2. **Project settings (gear) → General → Your apps → Web (`</>`)** → register an app → copy the
   `firebaseConfig` values.
3. Put them in your `.env` **and** in your deploy settings (GitHub Actions secrets):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
(These web-config values are public by design — they ship in every Firebase web app. What protects
your data is steps 4–6 below.)

## 2. Turn on sign-in methods
**Build → Authentication → Get started → Sign-in method**
- **Email/Password** → enable (leave "Email link" off).
- **Google** → enable, choose a support email.

**Authentication → Settings**
- **Authorized domains** → add EVERY address the site is served from, e.g. `plasma-care.vercel.app` and
  your `yourname.github.io`. (If a domain is missing, Google sign-in fails there.) `localhost` is there already.
- **User actions** → tick **Enable email enumeration protection** (stops attackers discovering which emails are registered).
- **Password policy** → require min length 10 + upper, lower, number, symbol, and **Enforce**.

**Authentication → Templates** → customise the "Email address verification" and "Password reset" emails
(sender name "Plasma Care").

## 3. Create the database
**Build → Firestore Database → Create database** → pick a location near India (e.g. `asia-south1`
Mumbai) → **Production mode**.

## 4. Publish the security rules  ← most important step
**Firestore Database → Rules** → delete everything → paste the whole file `firebase/firestore.rules`
from this project → **Publish**.
These rules make sure a customer can only ever read/write their own data, only after verifying their
email, with every field type-checked and length-limited.

## 5. Turn on App Check (blocks bots and copied apps)
1. https://www.google.com/recaptcha/admin → create a **reCAPTCHA v3** key for your domain (add
   `localhost` too if you test locally). Copy the **Site key** and the **Secret key**.
2. Firebase console → **App Check → Apps** → your web app → **reCAPTCHA v3** → paste the **Secret key** → Save.
3. Put the **Site key** in `VITE_FIREBASE_APPCHECK_SITE_KEY` and redeploy.
4. Open the site, sign in once or twice, then in **App Check → APIs** click **Enforce** for
   **Cloud Firestore** and **Authentication**. (Enforce only after the site key is live, otherwise the
   account page stops working.)

## 6. Add the variables where the site is BUILT  ← why the page says "being set up"
The `VITE_FIREBASE_*` values are baked into the site when it is built. If they are missing, `/account`
shows "Customer accounts are being set up". Add them to **each place you deploy from**, then redeploy:
- **Vercel**: Project → Settings → Environment Variables → add all 7 `VITE_FIREBASE_*` names (Production,
  Preview) → Deployments → ⋯ → **Redeploy**.
- **GitHub Pages**: Repo → Settings → Secrets and variables → Actions → New repository secret, same 7 names
  (`.github/workflows/deploy.yml` already passes them to the build) → re-run the workflow.
- reCAPTCHA (step 5): add `plasma-care.vercel.app` (and the github.io domain if used) to the key's domain list.
- Supabase → Authentication → URL configuration: make sure the Vercel address is an allowed redirect URL.

## 6b. Install + deploy
```
npm install      # adds the firebase package
npm run build
```
Then in **Supabase → SQL editor** run `supabase/customer_accounts_flag.sql`.

## 7. Switch it on
Developer panel → **Settings → Customer Accounts (Firebase)** → tick the box. A "My Account" button
appears on the homepage and `/#/account` starts working. Untick it to hide everything again instantly.

## Free-plan limits (Spark) — what to know
- Firestore: 50,000 reads / 20,000 writes / 20,000 deletes per day, 1 GiB stored. Each account page
  visit is roughly 5–15 reads, so this comfortably covers a few thousand visits a day.
- Authentication (email + Google): free for the usual volumes. **Phone/SMS sign-in is not used** — that is
  the part that needs a paid plan.
- Spark has no Cloud Functions, which is why all protection is done with security rules + App Check.
- If you ever hit a quota the account page shows an error but **booking, reports and the rest of the site
  keep working**, because they don't depend on Firebase.

## How the pieces fit
| What | Where it lives |
|---|---|
| Bookings, status, payments, reports metadata | Supabase (unchanged) |
| Report PDFs | Cloudinary (unchanged) |
| Customer login, profile, saved patients, saved addresses, "my bookings" pointers | Firebase |

A booking made while signed in is linked to the account automatically; the account page then reads the
live status and report link from Supabase, so nothing is duplicated or goes stale.
