-- Run this once in the Supabase SQL editor.
-- Seeds the test_panels catalog (extracted from the 105 sample report
-- formats) so the Report Generation screen can auto-fill parameter
-- name/unit/reference for any test -- staff only enter patient details
-- and result values. Run supabase/test_panels.sql first to create the table.
--
-- Uses dollar-quoted strings ($j$...$j$, $n$...$n$) for the JSON and notes
-- fields instead of '...' with doubled quotes, since a few test names
-- contain literal apostrophes (e.g. Widal 'O'/'H') -- dollar-quoting sidesteps
-- quote-escaping entirely.

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
insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Endocrinology',
  'Prolactin',
  'ENDOCRINOLOGY',
  $j$[{"key": "prolactin", "name": "PROLACTIN", "unit": "ng/mL", "reference": "< 15 ng/mL"}]$j$::jsonb,
  $n$$n$
);
insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Endocrinology',
  'T3',
  'ENDOCRINOLOGY',
  $j$[{"key": "serum_triiodothyronine_t3", "name": "SERUM TRIIODOTHYRONINE, T3", "unit": "ng/mL", "reference": "0.69 - 2.15"}]$j$::jsonb,
  $n$$n$
);
insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Endocrinology',
  'Thyroid Stimulating Hormone',
  'ENDOCRINOLOGY',
  $j$[{"key": "thyroid_stimulating_hormone_tsh", "name": "THYROID-STIMULATING HORMONE, TSH", "unit": "µIU/mL", "reference": "0.3 - 4.5"}]$j$::jsonb,
  $n$$n$
);
insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Microbiology',
  'Acid Fast Bacilli',
  'MICROBIOLOGY',
  $j$[{"key": "sample_type", "name": "SAMPLE TYPE", "unit": "", "reference": ""}, {"key": "result", "name": "RESULT", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);
insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Microbiology',
  'Grams Stain',
  'MICROBIOLOGY',
  $j$[{"key": "sample_type", "name": "SAMPLE TYPE", "unit": "", "reference": ""}, {"key": "result", "name": "RESULT", "unit": "", "reference": ""}]$j$::jsonb,
  $n$$n$
);
insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'ANA',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "anti_nuclear_antibody_ana_by", "name": "ANTI NUCLEAR ANTIBODY (ANA) BY", "unit": "Units", "reference": ""}]$j$::jsonb,
  $n$$n$
);
insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Anti Cardiolipin Antibodies',
  'SEROLOGY & IMMUNOLOGY — ANTI CARDIOLIPIN ANTIBODIES',
  $j$[{"key": "anti_cardiolipin_igg", "name": "ANTI CARDIOLIPIN IGG", "unit": "GPL", "reference": ""}, {"key": "anti_cardiolipin_igm", "name": "ANTI CARDIOLIPIN IGM", "unit": "MPL", "reference": ""}]$j$::jsonb,
  $n$$n$
);
insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Anti Phospholipid Antibodies',
  'SEROLOGY & IMMUNOLOGY — ANTI PHOSPHOLIPID ANTIBODIES',
  $j$[{"key": "anti_phospholipid_igg", "name": "ANTI PHOSPHOLIPID IGG", "unit": "GPL U/mL", "reference": ""}, {"key": "anti_phospholipid_igm", "name": "ANTI PHOSPHOLIPID IGM", "unit": "MPL U/mL", "reference": ""}]$j$::jsonb,
  $n$$n$
);
insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'ASO Titer',
  'SEROLOGY & IMMUNOLOGY',
  $j$[{"key": "antistreptolysin_o_aso_titer", "name": "ANTISTREPTOLYSIN O, ASO TITER", "unit": "IU/mL", "reference": "< 200"}]$j$::jsonb,
  $n$$n$
);
insert into test_panels (category, test_name, panel_heading, parameters, notes) values (
  'Serology and Immunology',
  'Beta 2 Glycoprotein 1 Antibodies',
  'SEROLOGY & IMMUNOLOGY — BETA 2 GLYCOPROTEIN 1, ANTIBODIES',
  $j$[{"key": "beta_2_glycoprotein_1_igg", "name": "BETA 2 GLYCOPROTEIN 1, IGG", "unit": "SGU", "reference": ""}, {"key": "beta_2_glycoprotein_1_igm", "name": "BETA 2 GLYCOPROTEIN 1, IGM", "unit": "SMU", "reference": ""}]$j$::jsonb,
  $n$$n$
);
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
