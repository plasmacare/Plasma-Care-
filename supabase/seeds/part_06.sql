-- Part 6 of 10 — paste this whole file into the Supabase SQL editor
-- and press Run, then move to the next part file. Splitting into small
-- chunks avoids mobile browsers truncating a big paste.
-- Run supabase/test_panels.sql FIRST (creates the table) if you haven't.

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Serum IGE',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_ige", "name": "SERUM IGE", "unit": "IU/mL", "reference": "1 - 190"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Sgot',
  'BIOCHEMISTRY',
  $j$[{"key": "sgot_ast", "name": "SGOT (AST)", "unit": "U/I", "reference": "0 - 37"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Sgpt',
  'BIOCHEMISTRY',
  $j$[{"key": "sgpt_alt", "name": "SGPT (ALT)", "unit": "U/I", "reference": "13 - 40"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Sodium',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_sodium", "name": "SERUM SODIUM", "unit": "mmol/L", "reference": "136 - 146"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Thyroglobulin Antibody',
  'BIOCHEMISTRY',
  $j$[{"key": "thyroglobulin_antibody_tgab", "name": "THYROGLOBULIN ANTIBODY (TGAB)", "unit": "IU/mL", "reference": "< 95 IU/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Thyroglobulin',
  'BIOCHEMISTRY',
  $j$[{"key": "thyroglobulin_tg", "name": "THYROGLOBULIN (TG)", "unit": "ng/mL", "reference": "< 55 ng/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Tibc',
  'BIOCHEMISTRY',
  $j$[{"key": "total_iron_binding_capacity_tibc", "name": "TOTAL IRON BINDING CAPACITY (TIBC)", "unit": "μg/dl", "reference": "240 - 450"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Triglycerides',
  'BIOCHEMISTRY',
  $j$[{"key": "triglycerides", "name": "TRIGLYCERIDES", "unit": "mg/dl", "reference": "25 - 200"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Troponin',
  'BIOCHEMISTRY',
  $j$[{"key": "troponin_i", "name": "TROPONIN I", "unit": "ng/mL", "reference": "< 0.1 ng/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Urea',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_urea", "name": "SERUM UREA", "unit": "mg/dl", "reference": "19 - 45"}]$j$::jsonb,
  $n$$n$
);
