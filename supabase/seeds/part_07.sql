-- Part 7 of 10 — paste this whole file into the Supabase SQL editor
-- and press Run, then move to the next part file. Splitting into small
-- chunks avoids mobile browsers truncating a big paste.
-- Run supabase/test_panels.sql FIRST (creates the table) if you haven't.

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Uric Acid',
  'BIOCHEMISTRY',
  $j$[{"key": "serum_uric_acid", "name": "SERUM URIC ACID", "unit": "mg/dl", "reference": "3.5 - 7.2"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Vitamin B12',
  'BIOCHEMISTRY',
  $j$[{"key": "vitamin_b12", "name": "VITAMIN B12", "unit": "pg/ml", "reference": "211 - 911"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Biochemistry',
  'Vitamin D3',
  'BIOCHEMISTRY',
  $j$[{"key": "25_hydroxy_oh_vitamin_d", "name": "25 HYDROXY (OH) VITAMIN D", "unit": "ng/mL", "reference": "30 - 100"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Clinical Pathology',
  'Albumin Creatinine Ratio Urine',
  'CLINICAL PATHOLOGY',
  $j$[{"key": "microalbumin", "name": "MICROALBUMIN", "unit": "mg/L", "reference": ""}, {"key": "urinary_creatinine", "name": "URINARY CREATININE", "unit": "mg/dL", "reference": ""}, {"key": "albumin_creatinine_ratio", "name": "ALBUMIN CREATININE RATIO", "unit": "mg/g", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Clinical Pathology',
  'Semen Examination',
  'CLINICAL PATHOLOGY',
  $j$[{"key": "quantity", "name": "QUANTITY", "unit": "ml", "reference": "2-3"}, {"key": "colour", "name": "COLOUR", "unit": "", "reference": ""}, {"key": "ph", "name": "PH", "unit": "", "reference": ""}, {"key": "collection_at", "name": "COLLECTION AT", "unit": "", "reference": ""}, {"key": "liquefaction_time", "name": "LIQUEFACTION TIME", "unit": "min", "reference": ""}, {"key": "total_sperm_count", "name": "TOTAL SPERM COUNT", "unit": "million/cumm", "reference": "60 - 200"}, {"key": "rapid_progressive", "name": "RAPID PROGRESSIVE", "unit": "%", "reference": ""}, {"key": "sluggish_progressive", "name": "SLUGGISH PROGRESSIVE", "unit": "%", "reference": ""}, {"key": "non_progressive", "name": "NON PROGRESSIVE", "unit": "%", "reference": ""}, {"key": "immotile", "name": "IMMOTILE", "unit": "%", "reference": ""}, {"key": "abnormal_forms", "name": "ABNORMAL FORMS", "unit": "%", "reference": ""}, {"key": "epithelial_cells", "name": "EPITHELIAL CELLS", "unit": "/HPF", "reference": ""}, {"key": "r_b_c", "name": "R.B.C.", "unit": "/HPF", "reference": ""}, {"key": "pus_cell", "name": "PUS CELL", "unit": "/HPF", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Clinical Pathology',
  'Urine Cortisol',
  'CLINICAL PATHOLOGY',
  $j$[{"key": "urine_cortisol", "name": "URINE CORTISOL", "unit": "μg/24 hrs", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Clinical Pathology',
  'Urine Routine',
  'CLINICAL PATHOLOGY',
  $j$[{"key": "quantity", "name": "QUANTITY", "unit": "ml", "reference": ""}, {"key": "colour", "name": "COLOUR", "unit": "Pale Yellow", "reference": ""}, {"key": "transparency", "name": "TRANSPARENCY", "unit": "Clear", "reference": ""}, {"key": "specific_gravity", "name": "SPECIFIC GRAVITY", "unit": "1.005 - 1.03", "reference": ""}, {"key": "ph", "name": "PH", "unit": "5-7", "reference": ""}, {"key": "leukocytes", "name": "LEUKOCYTES", "unit": "Absent", "reference": ""}, {"key": "blood", "name": "BLOOD", "unit": "Absent", "reference": ""}, {"key": "protein_albumin", "name": "PROTEIN / ALBUMIN", "unit": "Absent", "reference": ""}, {"key": "sugar_glucose", "name": "SUGAR / GLUCOSE", "unit": "Absent", "reference": ""}, {"key": "ketone_bodies", "name": "KETONE BODIES", "unit": "Absent", "reference": ""}, {"key": "bilirubin", "name": "BILIRUBIN", "unit": "Absent", "reference": ""}, {"key": "nitrite", "name": "NITRITE", "unit": "Absent", "reference": ""}, {"key": "r_b_c", "name": "R.B.C.", "unit": "/HPF", "reference": "Absent"}, {"key": "pus_cells", "name": "PUS CELLS", "unit": "/HPF", "reference": "Absent"}, {"key": "epithilial_cells", "name": "EPITHILIAL CELLS", "unit": "/HPF", "reference": "Absent"}, {"key": "casts", "name": "CASTS", "unit": "Absent", "reference": ""}, {"key": "crystals", "name": "CRYSTALS", "unit": "", "reference": ""}, {"key": "bacteria", "name": "BACTERIA", "unit": "Absent", "reference": ""}, {"key": "others", "name": "OTHERS", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Endocrinology',
  'Alfa Fetoprotein',
  'ENDOCRINOLOGY',
  $j$[{"key": "alfa_fetoprotein_afp", "name": "ALFA FETOPROTEIN, AFP", "unit": "ng/mL", "reference": "< 10"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Endocrinology',
  'Folic Acid',
  'ENDOCRINOLOGY',
  $j$[{"key": "folic_acid", "name": "FOLIC ACID", "unit": "ng/mL", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Endocrinology',
  'Luteinising Hormone',
  'ENDOCRINOLOGY',
  $j$[{"key": "luteinising_hormone_lh", "name": "LUTEINISING HORMONE, LH", "unit": "mIU/mL", "reference": ""}]$j$::jsonb,
  $n$$n$
);
