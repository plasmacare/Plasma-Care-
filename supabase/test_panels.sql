-- Run this once in the Supabase SQL editor (then run test_panels_seed.sql
-- to load the 100 extracted test/parameter definitions).
--
-- Backs the "Report Generation" admin tab: pick a test → its parameters
-- (name, unit, reference range) auto-fill from here → staff only enter
-- patient details + result values. The final PDF is rendered with the
-- app's own Plasma Care branded template (LabReportTemplate.jsx) — no
-- external files or logos are used, so there's nothing else to store
-- per test beyond this metadata.

create table if not exists test_panels (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  test_name text not null,
  panel_heading text,
  -- parameters: [{ key: "hemoglobin", name: "HEMOGLOBIN", unit: "g/dl", reference: "13 - 17" }, ...]
  parameters jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists test_panels_category_idx on test_panels (category);
create index if not exists test_panels_test_name_idx on test_panels (test_name);

alter table test_panels enable row level security;

drop policy if exists "Admins can manage test panels" on test_panels;
create policy "Admins can manage test panels"
  on test_panels for all
  to authenticated
  using (true)
  with check (true);
