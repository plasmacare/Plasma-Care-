-- Part 3 of 10 — paste this whole file into the Supabase SQL editor
-- and press Run, then move to the next part file. Splitting into small
-- chunks avoids mobile browsers truncating a big paste.
-- Run supabase/test_panels.sql FIRST (creates the table) if you haven't.

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'TLC',
  'HAEMATOLOGY',
  $j$[{"key": "total_leukocyte_count", "name": "TOTAL LEUKOCYTE COUNT", "unit": "cumm", "reference": "4,800 - 10,800"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Albumin',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_albumin", "name": "SERUM ALBUMIN", "unit": "g/dl", "reference": "3.5 - 5.2"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Alkaline Phosphatase',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_alkaline_phosphatase", "name": "SERUM ALKALINE PHOSPHATASE", "unit": "U/I", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Amylase',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_amylase", "name": "SERUM AMYLASE", "unit": "IU/L", "reference": "0 - 120"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Anti TPO',
  'BIOCHEMISTRY',
  $j$[{"key": "anti_tpo", "name": "ANTI TPO", "unit": "IU/mL", "reference": "< 30 IU/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Bilirubin Total',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_bilirubin_total", "name": "SERUM BILIRUBIN (TOTAL)", "unit": "mg/dl", "reference": "0.2 - 1.2"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Blood Sugar PP',
  'BIOCHEMISTRY',
  $j$[{"key": "blood_sugar_pp", "name": "BLOOD SUGAR PP", "unit": "mg/dl", "reference": "< 140 mg/dl"}]$j$::jsonb,
  $n$Elevated glucose levels (hyperglycemia) are most often encountered clinically in the setting of diabetes mellitus, but they may also occur with pancreatic neoplasms, hyperthyroidism, and adrenocortical dysfunction. Decreased glucose levels (hypoglycemia) may result from endogenous or exogenous insulin excess, prolonged starvation, or liver disease.$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'BUN',
  'BIOCHEMISTRY',
  $j$[{"key": "bun", "name": "BUN", "unit": "mg/dl", "reference": "7.9 - 20"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Calcitonin',
  'BIOCHEMISTRY',
  $j$[{"key": "calcitonin", "name": "CALCITONIN", "unit": "pg/mL", "reference": "< 18 pg/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Calcium',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_calcium", "name": "SERUM CALCIUM", "unit": "mg/dl", "reference": "8.8 - 10.6"}]$j$::jsonb,
  $n$$n$
);
