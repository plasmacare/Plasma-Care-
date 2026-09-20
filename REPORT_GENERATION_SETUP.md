# Report Generation — setup

Pick a test → its parameters (name, unit, reference range) auto-fill from
a catalog extracted from 100 sample lab report formats → fill in patient
details and result values → get a final report in **Plasma Care's own
branded design** (`LabReportTemplate.jsx` — the same template the
booking-level report builder already used) → share.

Nothing here uploads or reuses another lab's original PDF/logo — the
design is Plasma Care's own; only the *clinical structure* (which
parameters a test has, their units and reference ranges) was extracted
from the sample formats.

## 1. Run the Supabase migration

In the Supabase SQL editor, run, in order:
1. `supabase/test_panels.sql` — creates the `test_panels` table
2. `supabase/seeds/part_01.sql` through `part_10.sql` — loads the 100
   extracted test/parameter definitions (Panel, Haematology,
   Biochemistry, Clinical Pathology, Endocrinology, Microbiology,
   Serology and Immunology), 10 tests per file. Run them one at a time
   (paste the whole file, press Run, move to the next) — split into
   small chunks specifically so a mobile browser's paste doesn't
   truncate a giant single file.

**Not included:** 5 Microbiology "culture & sensitivity" formats (blood,
pus, sputum, stool, urine) use a completely different report shape
(organism + antibiotic sensitivity table, not TEST/VALUE/UNIT/REFERENCE)
and weren't auto-extracted. Add these as their own thing later if needed
— they don't fit the same catalog shape as the other 100.

## 2. Cloudinary (unchanged)

Every generated report PDF (booking-level and standalone) uploads to
Cloudinary — cloud name `uvkq2mlt`, unsigned preset `plasma-care-reports`
— so the link shared with a customer never reveals Supabase. Already set
in `.env`; for the GitHub Pages deploy, `VITE_CLOUDINARY_CLOUD_NAME` and
`VITE_CLOUDINARY_UPLOAD_PRESET` are repo secrets already in place.

## 3. Using it

**Admin panel → Report Generation:**
1. Search/pick a test — parameters, units and reference ranges appear
   pre-filled (editable if needed; you can also add/remove rows)
2. Fill in patient details (name, age, sex, referring doctor, reg no.,
   registered/received on) and each parameter's result value
3. **Generate report** → **Share** / **Share on WhatsApp** / **Copy link**

**Bookings → Generate report** (existing flow) is unchanged — it still
builds its own sections manually and now also uploads to Cloudinary
instead of Supabase Storage, for the same link-privacy reason.

## 4. Fixing a parameter's reference range

If an extracted reference range looks off for a given test, just fix it
inline in the Report Generation screen and generate — nothing is
persisted back to the catalog automatically. To fix the catalog itself
(so it's right every time), update that test_panels row's `parameters`
JSON directly in the Supabase table editor.
