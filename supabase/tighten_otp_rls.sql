-- Run this AFTER deploying the send-otp / verify-otp Edge Functions.
-- The client no longer talks to otp_verifications directly — only the
-- Edge Functions do (via the service role key, which bypasses RLS).
-- So we remove the public policies entirely, locking the table down.

drop policy if exists "public insert otp" on otp_verifications;
drop policy if exists "public update otp" on otp_verifications;

-- No new policies added — table is now only reachable via service role.
