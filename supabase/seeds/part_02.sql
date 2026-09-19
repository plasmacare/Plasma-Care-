-- Part 2 of 10 — paste this whole file into the Supabase SQL editor
-- and press Run, then move to the next part file. Splitting into small
-- chunks avoids mobile browsers truncating a big paste.
-- Run supabase/test_panels.sql FIRST (creates the table) if you haven't.

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'DLC',
  'HAEMATOLOGY',
  $j$[{"key": "neutrophils", "name": "NEUTROPHILS", "unit": "%", "reference": "40 - 80"}, {"key": "lymphocyte", "name": "LYMPHOCYTE", "unit": "%", "reference": "20 - 40"}, {"key": "eosinophils", "name": "EOSINOPHILS", "unit": "%", "reference": "1-6"}, {"key": "monocytes", "name": "MONOCYTES", "unit": "%", "reference": "2 - 10"}, {"key": "basophils", "name": "BASOPHILS", "unit": "%", "reference": "<2"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'ESR Westergren',
  'HAEMATOLOGY',
  $j$[{"key": "erythrocyte_sedimentation_rate", "name": "ERYTHROCYTE SEDIMENTATION RATE", "unit": "mm for 1st hour", "reference": "0 - 10"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'ESR Wintrobe',
  'HAEMATOLOGY',
  $j$[{"key": "erythrocyte_sedimentation_rate", "name": "ERYTHROCYTE SEDIMENTATION RATE", "unit": "mm for 1st hour", "reference": "0-9"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'G6pd',
  'HAEMATOLOGY',
  $j$[{"key": "glucose_6_phosphate", "name": "GLUCOSE-6-PHOSPHATE", "unit": "g", "reference": "5.5 - 20.5"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'Hemoglobin',
  'HAEMATOLOGY',
  $j$[{"key": "hemoglobin", "name": "HEMOGLOBIN", "unit": "g/dl", "reference": "13 - 17"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'MF Card Test',
  'HAEMATOLOGY',
  $j$[{"key": "filarial_parasite_card_test", "name": "FILARIAL PARASITE (CARD TEST)", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'MP Card Test',
  'HAEMATOLOGY',
  $j$[{"key": "plasmodium_falciparum_pf", "name": "PLASMODIUM FALCIPARUM \"PF\"", "unit": "", "reference": ""}, {"key": "plasmodium_vivax_pv", "name": "PLASMODIUM VIVAX \"PV\"", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'Platelet Count',
  'HAEMATOLOGY',
  $j$[{"key": "platelet_count", "name": "PLATELET COUNT", "unit": "lakhs/cumm", "reference": "1.5 - 4.1"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'Ptinr',
  'HAEMATOLOGY',
  $j$[{"key": "patient_value", "name": "PATIENT VALUE", "unit": "seconds", "reference": "10 - 16"}, {"key": "control_value", "name": "CONTROL VALUE", "unit": "seconds", "reference": ""}, {"key": "isi_international_sensitivity", "name": "ISI (INTERNATIONAL SENSITIVITY", "unit": "", "reference": ""}, {"key": "inr_value", "name": "INR VALUE", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'Reticulocyte Count',
  'HAEMATOLOGY',
  $j$[{"key": "reticulocyte_count", "name": "RETICULOCYTE COUNT", "unit": "%", "reference": "0.5 - 2.5"}]$j$::jsonb,
  $n$$n$
);
