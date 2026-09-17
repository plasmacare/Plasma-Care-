# Report Generation (Cloudinary + Supabase) — setup

Everything in the app — auth, bookings, catalog, payments, and now the
**Report Generation** template library too — stays on Supabase. Only the
actual PDF files (report formats + generated reports) live on
**Cloudinary**, so a shared report link never reveals which database the
app runs on.

## 1. Run the Supabase migration

In the Supabase SQL editor, run `supabase/report_templates.sql`. It
creates the `report_templates` table (category, test name, Cloudinary
URL, and the field-position mapping) with the same admin-only RLS policy
pattern as the rest of the app.

## 2. Cloudinary — already set up

- Cloud name: `uvkq2mlt`
- Unsigned upload preset: `plasma-care-reports`

These are already in `.env`. If you ever need to recreate the preset:
Cloudinary Dashboard → Settings → Upload → Upload presets → Add upload
preset → **Signing Mode: Unsigned**.

For the GitHub Pages deploy, add these two as repo secrets under
**Settings → Secrets and variables → Actions**:

```
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
```

(the workflow already reads them — see `.github/workflows/deploy.yml`)

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
uploads the result to Cloudinary; the booking and lab report records in
Supabase are updated with that PDF's Cloudinary URL exactly as the
existing generic builder does, so the customer-facing report page keeps
working unchanged — and the shared link is a Cloudinary URL, not a
Supabase one.

If no format matches yet, the existing generic report builder (unchanged)
is still the only option — nothing about the current flow was removed.

## Note on deleting templates

Cloudinary's unsigned upload preset lets the browser upload files without
exposing a secret key — but that also means the browser can't delete
files from Cloudinary (deletion requires a signed, server-side request).
Deleting a template in the admin tab removes its Supabase record (so it
stops showing up / matching), but the PDF stays on Cloudinary. That's
harmless — if you want to actually clean up unused files later, do it
from the Cloudinary Media Library, or add a small signed server-side
delete endpoint (e.g. a Supabase Edge Function using the Cloudinary API
secret) if this becomes worth automating.
