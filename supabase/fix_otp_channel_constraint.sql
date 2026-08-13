-- Run this once in the Supabase SQL editor.
--
-- The customer app now sends OTPs with channel = 'sms' by default (it
-- used to only ever be 'whatsapp' or 'call'). If otp_verifications.channel
-- has an old CHECK constraint limiting it to those original values, every
-- OTP send fails at the database-insert step. This finds and drops any
-- such constraint — safe to run even if none exists (the loop just does
-- nothing).

do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'otp_verifications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%channel%'
  loop
    execute format('alter table otp_verifications drop constraint %I', con.conname);
  end loop;
end $$;
