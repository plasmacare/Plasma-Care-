-- Part 8 of 10 — paste this whole file into the Supabase SQL editor
-- and press Run, then move to the next part file. Splitting into small
-- chunks avoids mobile browsers truncating a big paste.
-- Run supabase/test_panels.sql FIRST (creates the table) if you haven't.

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
