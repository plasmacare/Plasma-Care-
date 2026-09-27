-- Run this once in the Supabase SQL editor.
-- Custom-recorded audio for the guided assistant's spoken prompts —
-- built specifically so Odia can have a real spoken voice (recorded by
-- the business owner) even though no browser supports Odia
-- text-to-speech. `key` matches the keys in
-- src/lib/seniorAssistantStrings.js (stepPatient, stepTests, etc.).

create table if not exists voice_clips (
  lang text not null,
  key text not null,
  audio_url text not null,
  updated_at timestamptz not null default now(),
  primary key (lang, key)
);

alter table voice_clips enable row level security;

drop policy if exists "Anyone can read voice clips" on voice_clips;
create policy "Anyone can read voice clips"
  on voice_clips for select
  to anon, authenticated
  using (true);

drop policy if exists "Staff can manage voice clips" on voice_clips;
create policy "Staff can manage voice clips"
  on voice_clips for all
  to authenticated
  using (true)
  with check (true);
