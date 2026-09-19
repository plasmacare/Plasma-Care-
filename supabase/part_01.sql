-- Part 1 of 10 — paste this whole file into the Supabase SQL editor
-- and press Run, then move to the next part file. Splitting into small
-- chunks avoids mobile browsers truncating a big paste.
-- Run supabase/test_panels.sql FIRST (creates the table) if you haven't.

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Panel',
  'CBC',
  'HAEMATOLOGY — COMPLETE BLOOD COUNT (CBC)',
  $j$[{"key": "hemoglobin", "name": "HEMOGLOBIN", "unit": "g/dl", "reference": "13 - 17"}, {"key": "total_leukocyte_count", "name": "TOTAL LEUKOCYTE COUNT", "unit": "cumm", "reference": "4,800 - 10,800"}, {"key": "neutrophils", "name": "NEUTROPHILS", "unit": "%", "reference": "40 - 80"}, {"key": "lymphocyte", "name": "LYMPHOCYTE", "unit": "%", "reference": "20 - 40"}, {"key": "eosinophils", "name": "EOSINOPHILS", "unit": "%", "reference": "1-6"}, {"key": "monocytes", "name": "MONOCYTES", "unit": "%", "reference": "2 - 10"}, {"key": "basophils", "name": "BASOPHILS", "unit": "%", "reference": "<2"}, {"key": "platelet_count", "name": "PLATELET COUNT", "unit": "lakhs/cumm", "reference": "1.5 - 4.1"}, {"key": "total_rbc_count", "name": "TOTAL RBC COUNT", "unit": "million/cumm", "reference": "4.5 - 5.5"}, {"key": "hematocrit_value_hct", "name": "HEMATOCRIT VALUE, HCT", "unit": "%", "reference": "40 - 50"}, {"key": "mean_corpuscular_volume_mcv", "name": "MEAN CORPUSCULAR VOLUME, MCV", "unit": "fL", "reference": "83 - 101"}, {"key": "mean_cell_haemoglobin_mch", "name": "MEAN CELL HAEMOGLOBIN, MCH", "unit": "Pg", "reference": "27 - 32"}, {"key": "mean_cell_haemoglobin_con_mchc", "name": "MEAN CELL HAEMOGLOBIN CON, MCHC", "unit": "%", "reference": "31.5 - 34.5"}]$j$::jsonb,
  $n$A complete blood count (CBC) is used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia. There have been some reports of WBC and platelet counts being lower in venous blood than in capillary blood samples, although still within these reference ranges.$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Panel',
  'Free Thyroid Function Test',
  'ENDOCRINOLOGY — FREE THYROID FUNCTION TEST (FTFT)',
  $j$[{"key": "free_triiodothyronine_l_ft3", "name": "FREE TRIIODOTHYRONINE L, FT3", "unit": "pg/mL", "reference": "2 - 4.2"}, {"key": "free_thyroxine_ft4", "name": "FREE THYROXINE, FT4", "unit": "pg/mL", "reference": "8.9 - 17.2"}, {"key": "thyroid_stimulating_hormone_tsh", "name": "THYROID-STIMULATING HORMONE, TSH", "unit": "µIU/mL", "reference": "0.3 - 4.5"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Panel',
  'Iron Studies',
  'BIOCHEMISTRY — IRON STUDIES',
  $j$[{"key": "iron", "name": "IRON", "unit": "μg/dl", "reference": "65 - 175"}, {"key": "uibc", "name": "UIBC", "unit": "μg/dl", "reference": "155 - 355"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Panel',
  'KFT',
  'BIOCHEMISTRY — KIDNEY FUNCTION TEST (KFT)',
  $j$[{"key": "bun", "name": "BUN", "unit": "mg/dl", "reference": "7.9 - 20"}, {"key": "serum_urea", "name": "SERUM UREA", "unit": "mg/dl", "reference": "19 - 45"}, {"key": "serum_creatinine", "name": "SERUM CREATININE", "unit": "mg/dl", "reference": "0.72 - 1.18"}, {"key": "egfr", "name": "EGFR", "unit": "ml/min/1.73m^2", "reference": "> 90"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Panel',
  'LFT',
  'BIOCHEMISTRY — LIVER FUNCTION TEST (LFT)',
  $j$[{"key": "serum_bilirubin_total", "name": "SERUM BILIRUBIN (TOTAL)", "unit": "mg/dl", "reference": "0.2 - 1.2"}, {"key": "serum_bilirubin_direct", "name": "SERUM BILIRUBIN (DIRECT)", "unit": "mg/dl", "reference": "0 - 0.3"}, {"key": "serum_bilirubin_indirect", "name": "SERUM BILIRUBIN (INDIRECT)", "unit": "mg/dl", "reference": "0.2 - 1"}, {"key": "sgpt_alt", "name": "SGPT (ALT)", "unit": "U/I", "reference": "13 - 40"}, {"key": "sgot_ast", "name": "SGOT (AST)", "unit": "U/I", "reference": "0 - 37"}, {"key": "serum_alkaline_phosphatase", "name": "SERUM ALKALINE PHOSPHATASE", "unit": "U/I", "reference": ""}, {"key": "serum_protein", "name": "SERUM PROTEIN", "unit": "g/dl", "reference": "6.4 - 8.3"}, {"key": "serum_albumin", "name": "SERUM ALBUMIN", "unit": "g/dl", "reference": "3.5 - 5.2"}, {"key": "globulin", "name": "GLOBULIN", "unit": "g/dl", "reference": "1.8 - 3.6"}, {"key": "a_g_ratio", "name": "A/G RATIO", "unit": "1.1 - 2.1", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Panel',
  'Lipid Profile',
  'BIOCHEMISTRY — LIPID PROFILE',
  $j$[{"key": "total_cholesterol", "name": "TOTAL CHOLESTEROL", "unit": "mg/dl", "reference": "125 - 200"}, {"key": "triglycerides", "name": "TRIGLYCERIDES", "unit": "mg/dl", "reference": "25 - 200"}, {"key": "hdl_cholesterol", "name": "HDL CHOLESTEROL", "unit": "mg/dl", "reference": "35 - 80"}, {"key": "ldl_cholesterol", "name": "LDL CHOLESTEROL", "unit": "mg/dl", "reference": "85 - 130"}, {"key": "vldl_cholesterol", "name": "VLDL CHOLESTEROL", "unit": "mg/dl", "reference": "5 - 40"}, {"key": "ldl_hdl", "name": "LDL / HDL", "unit": "1.5 - 3.5", "reference": ""}, {"key": "total_cholesterol_hdl", "name": "TOTAL CHOLESTEROL / HDL", "unit": "3.27", "reference": "3.5 - 5"}, {"key": "tg_hdl", "name": "TG / HDL", "unit": "", "reference": ""}, {"key": "non_hdl_cholesterol", "name": "NON-HDL CHOLESTEROL", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Panel',
  'Thyroid Function Test',
  'ENDOCRINOLOGY — THYROID FUNCTION TEST (TFT)',
  $j$[{"key": "serum_triiodothyronine_t3", "name": "SERUM TRIIODOTHYRONINE, T3", "unit": "ng/mL", "reference": "0.69 - 2.15"}, {"key": "serum_thyroxine_t4", "name": "SERUM THYROXINE, T4", "unit": "ng/mL", "reference": "52 - 127"}, {"key": "thyroid_stimulating_hormone_tsh", "name": "THYROID-STIMULATING HORMONE, TSH", "unit": "µIU/mL", "reference": "0.3 - 4.5"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Panel',
  'Viral Marker',
  'SEROLOGY & IMMUNOLOGY — VIRAL MARKER',
  $j$[{"key": "hiv_1", "name": "HIV - 1", "unit": "", "reference": ""}, {"key": "hiv_2", "name": "HIV - 2", "unit": "", "reference": ""}, {"key": "vdrl", "name": "VDRL", "unit": "", "reference": ""}, {"key": "hepatitis_c_virus_hcv", "name": "HEPATITIS C VIRUS, HCV", "unit": "", "reference": ""}, {"key": "hbsag", "name": "HBSAG", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'Absolute Eosinophil Count',
  'HAEMATOLOGY',
  $j$[{"key": "absolute_eosinophil_count", "name": "ABSOLUTE EOSINOPHIL COUNT", "unit": "cumm", "reference": "0 - 440"}]$j$::jsonb,
  $n$$n$
);

insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Haematology',
  'Aptt',
  'HAEMATOLOGY',
  $j$[{"key": "patient_value", "name": "PATIENT VALUE", "unit": "seconds", "reference": "22 - 39"}, {"key": "control_value", "name": "CONTROL VALUE", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);
