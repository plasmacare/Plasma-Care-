-- Run this once in the Supabase SQL editor.
-- Backs the "Report Generation" admin tab: a library of original report
-- format PDFs (one per test), each with click-to-place field positions
-- used to overlay patient/result data onto the original design. The PDF
-- files themselves are stored on Cloudinary — this table only holds
-- metadata + the field position mapping.

create table if not exists report_templates (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  test_name text not null,
  file_name text not null,
  storage_url text not null,
  storage_public_id text,
  -- fields: [{ key: "value_sgot", xPct: 42.3, yPct: 61.8, fontSize: 10 }, ...]
  fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists report_templates_category_idx on report_templates (category);

alter table report_templates enable row level security;

drop policy if exists "Admins can manage report templates" on report_templates;
create policy "Admins can manage report templates"
  on report_templates for all
  to authenticated
  using (true)
  with check (true);
