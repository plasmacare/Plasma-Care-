-- Part 5 of 10 — paste this whole file into the Supabase SQL editor
-- and press Run, then move to the next part file. Splitting into small
-- chunks avoids mobile browsers truncating a big paste.
-- Run supabase/test_panels.sql FIRST (creates the table) if you haven't.

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'GGT',
  'BIOCHEMISTRY',
  $j$[{"key": "gamma_glutamyl_transferase_ggt", "name": "GAMMA GLUTAMYL TRANSFERASE, GGT", "unit": "IU/L", "reference": "9 - 52"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'GTT',
  'BIOCHEMISTRY',
  $j$[{"key": "fasting", "name": "FASTING", "unit": "mg/dl", "reference": "< 100"}, {"key": "1_hour", "name": "1 HOUR", "unit": "mg/dl", "reference": "< 190"}, {"key": "2_hour", "name": "2 HOUR", "unit": "mg/dl", "reference": "< 165"}, {"key": "3_hour", "name": "3 HOUR", "unit": "mg/dl", "reference": "< 145"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Hba1c',
  'BIOCHEMISTRY',
  $j$[{"key": "hba1c", "name": "HBA1C", "unit": "%", "reference": ""}, {"key": "estimated_average_glucose", "name": "ESTIMATED AVERAGE GLUCOSE", "unit": "mg/dL", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Indirect Coombs Test',
  'BIOCHEMISTRY',
  $j$[{"key": "indirect_coomb_s_test", "name": "INDIRECT COOMB'S TEST", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Iron',
  'BIOCHEMISTRY',
  $j$[{"key": "iron", "name": "IRON", "unit": "μg/dl", "reference": "65 - 175"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Lipase',
  'BIOCHEMISTRY',
  $j$[{"key": "lipase", "name": "LIPASE", "unit": "U/I", "reference": "0 - 67"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Phosphorus',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_phosphorus", "name": "SERUM PHOSPHORUS", "unit": "mg/dl", "reference": "2.5 - 4.5"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Potassium',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_potassium", "name": "SERUM POTASSIUM", "unit": "mmol/L", "reference": "3.5 - 5.1"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Protein',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_protein", "name": "SERUM PROTEIN", "unit": "g/dl", "reference": "6.4 - 8.3"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'RBS',
  'BIOCHEMISTRY',
  $j$[{"key": "random_blood_sugar", "name": "RANDOM BLOOD SUGAR", "unit": "mg/dl", "reference": "70 - 140"}]$j$::jsonb,
  $n$$n$
);
