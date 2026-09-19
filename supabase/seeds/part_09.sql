-- Part 9 of 10 — paste this whole file into the Supabase SQL editor
-- and press Run, then move to the next part file. Splitting into small
-- chunks avoids mobile browsers truncating a big paste.
-- Run supabase/test_panels.sql FIRST (creates the table) if you haven't.

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Beta HCG',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "beta_human_chorionic", "name": "BETA HUMAN CHORIONIC", "unit": "mIU/mL", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'C Reactive Protein',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "c_reactive_protein_crp", "name": "C-REACTIVE PROTEIN, CRP", "unit": "mg/L", "reference": "< 6 mg/L"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Chikungunya',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "chikungunya", "name": "CHIKUNGUNYA", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Dengue Ns1 Antigen',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "dengue_ns1_antigen", "name": "DENGUE NS1 ANTIGEN", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Free Testosterone',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "testosterone_free", "name": "TESTOSTERONE FREE", "unit": "pg/mL", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Hbeag',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "hbeag", "name": "HBEAG", "unit": "index/mL", "reference": "< 15 index/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Hbsag',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "hbsag", "name": "HBSAG", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Hepatitis C',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "hepatitis_c_virus_hcv", "name": "HEPATITIS C VIRUS, HCV", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'HIV Card',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "hiv_1", "name": "HIV - 1", "unit": "", "reference": ""}, {"key": "hiv_2", "name": "HIV - 2", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Insulin Random',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "insulin_random", "name": "INSULIN RANDOM", "unit": "µU/mL", "reference": ""}]$j$::jsonb,
  $n$$n$
);
