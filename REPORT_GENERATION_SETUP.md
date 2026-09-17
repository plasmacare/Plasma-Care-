# Report Generation (Firebase) — setup

The rest of the app (auth, bookings, catalog, payments, etc.) is unchanged
and stays on Supabase. Only the new **Report Generation** admin tab and its
report-format library live in Firebase project `plasma-care`.

## 1. One-time Firebase console setup

1. **Enable Anonymous sign-in**: Firebase Console → Build → Authentication →
   Sign-in method → enable **Anonymous**.
   The app is authenticated via Supabase, not Firebase — this anonymous
   sign-in exists only so Firestore/Storage security rules (which require
   `request.auth != null`) are satisfied. Real access control (who can
   reach this tab at all) is Supabase's staff/admin role check.
2. **Enable Firestore** (Native mode) and **Storage** if not already on.
3. **Deploy the security rules** in `firebase/firestore.rules` and
   `firebase/storage.rules` (via the Firebase console's Rules editor, or
   `firebase deploy --only firestore:rules,storage` with the Firebase CLI).

## 2. Environment variables

Add these to your local `.env` (already filled in for you — see `.env`)
and, for the GitHub Pages deploy, as repo secrets under
**Settings → Secrets and variables → Actions**:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Values are in `.env` already / in the Firebase console under
Project settings → Your apps → Web app.

## 3. Uploading the report formats

Go to **Admin panel → Report Generation**, pick a category tab (Panel,
Haematology, Biochemistry, etc.), then **Upload format PDF(s)** — you can
multi-select every file for that category at once (e.g. everything in
"Biochemistry Test Report Formats"). Each becomes a template row; the test
name is guessed from the file name and can be fixed with **Rename**.

## 4. Mapping fields (pixel-perfect placement)

Click **Map fields** on a template. The original PDF renders on screen;
type a field name (e.g. `patientName`, `value_sgot`) and click the exact
spot on the page where that value should print. Repeat for every value the
format needs — patient details plus one field per result row for
multi-parameter panels (CBC, LFT, Lipid Profile, etc.). Save when done.

Recommended field name conventions (the booking-level report builder fills
these in automatically when they exist):
- `patientName`, `age`, `sex`, `refDoctor`, `regNo`, `sampleId`, `reportedOn`
- `value_<test name, lowercased/underscored>` and `unit_<same>` per result
  row (e.g. a row named "SGOT" → `value_sgot`, `unit_sgot`)

## 5. Using a format when generating a report

In **Bookings → Generate report**, once a test name in the report matches
an uploaded format, a **"Pixel-perfect format found"** dropdown appears
with a **Generate using original format PDF instead** button. This
overlays the entered values onto the original PDF (via `pdf-lib`) and
uploads the result to Firebase Storage; the booking and lab report records
in Supabase are updated with that PDF's URL exactly as the existing
generic builder does, so the customer-facing report page keeps working
unchanged.

If no format matches yet, the existing generic report builder (unchanged)
is still the only option — nothing about the current flow was removed.
