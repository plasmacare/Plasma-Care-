-- Part 4 of 10 — paste this whole file into the Supabase SQL editor
-- and press Run, then move to the next part file. Splitting into small
-- chunks avoids mobile browsers truncating a big paste.
-- Run supabase/test_panels.sql FIRST (creates the table) if you haven't.

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'CCP',
  'BIOCHEMISTRY',
  $j$[{"key": "anti_cyclic_citrullinated_peptide", "name": "ANTI CYCLIC-CITRULLINATED-PEPTIDE", "unit": "U/mL", "reference": "< 5 U/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Chloride',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_chloride", "name": "SERUM CHLORIDE", "unit": "mmol/l", "reference": "98 - 107"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Cholesterol',
  'BIOCHEMISTRY',
  $j$[{"key": "total_cholesterol", "name": "TOTAL CHOLESTEROL", "unit": "mg/dl", "reference": "125 - 200"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'CMV Antibody',
  'BIOCHEMISTRY',
  $j$[{"key": "cmv_igg", "name": "CMV IGG", "unit": "AU/mL", "reference": "<2"}, {"key": "cmv_igm", "name": "CMV IGM", "unit": "AU/mL", "reference": "Neg. < 2.0 AU/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Cpkmb',
  'BIOCHEMISTRY',
  $j$[{"key": "cpk_mb", "name": "CPK-MB", "unit": "ng/mL", "reference": "< 5 ng/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Creatinine',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_creatinine", "name": "SERUM CREATININE", "unit": "mg/dl", "reference": "0.72 - 1.18"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'D Dimer',
  'BIOCHEMISTRY',
  $j$[{"key": "d_dimer", "name": "D-DIMER", "unit": "μg FEU/mL", "reference": "< 0.5 μg FEU/mL"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Dhea',
  'BIOCHEMISTRY',
  $j$[{"key": "dhea", "name": "DHEA", "unit": "μg/dl", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Fasting Blood Sugar',
  'BIOCHEMISTRY',
  $j$[{"key": "fasting_blood_sugar", "name": "FASTING BLOOD SUGAR", "unit": "mg/dl", "reference": "70 - 100"}]$j$::jsonb,
  $n$Elevated glucose levels (hyperglycemia) are most often encountered clinically in the setting of diabetes mellitus, but they may also occur with pancreatic neoplasms, hyperthyroidism, and adrenocortical dysfunction. Decreased glucose levels (hypoglycemia) may result from endogenous or exogenous insulin excess, prolonged starvation, or liver disease.$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Ferritin',
  'BIOCHEMISTRY',
  $j$[{"key": "ferritin", "name": "FERRITIN", "unit": "ng/mL", "reference": "22 - 332"}]$j$::jsonb,
  $n$$n$
);
