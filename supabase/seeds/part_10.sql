-- Part 10 of 10 — paste this whole file into the Supabase SQL editor
-- and press Run, then move to the next part file. Splitting into small
-- chunks avoids mobile browsers truncating a big paste.
-- Run supabase/test_panels.sql FIRST (creates the table) if you haven't.

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Malaria Antigen',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "igg", "name": "IGG", "unit": "", "reference": ""}, {"key": "igm", "name": "IGM", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Myoglobin',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "myoglobin", "name": "MYOGLOBIN", "unit": "ng/mL", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Occult Blood',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "occult_blood_stool", "name": "OCCULT BLOOD, STOOL", "unit": "Absent", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Progesterone',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "progesterone", "name": "PROGESTERONE", "unit": "ng/mL", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Rheumatoid Factor',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "rheumatoid_factor_ra", "name": "RHEUMATOID FACTOR, RA", "unit": "IU/mL", "reference": "0 - 20"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Rubella',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "igg", "name": "IGG", "unit": "U/mL", "reference": "< 8.00"}, {"key": "igm", "name": "IGM", "unit": "U/mL", "reference": "< 8.00"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Total PSA',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "total_psa", "name": "TOTAL PSA", "unit": "ng/mL", "reference": "< 4 ng/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Total Testosterone',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "testosterone_total", "name": "TESTOSTERONE TOTAL", "unit": "ng/dl", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Vdrl',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "vdrl", "name": "VDRL", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Widal Slide',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "salmonella_typhi_o", "name": "SALMONELLA TYPHI 'O'", "unit": "", "reference": ""}, {"key": "salmonella_typhi_h", "name": "SALMONELLA TYPHI 'H'", "unit": "", "reference": ""}, {"key": "salmonella_typhi_ah", "name": "SALMONELLA TYPHI 'AH'", "unit": "", "reference": ""}, {"key": "salmonella_typhi_bh", "name": "SALMONELLA TYPHI 'BH'", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);
