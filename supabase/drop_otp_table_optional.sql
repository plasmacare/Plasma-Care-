-- OPTIONAL — run only if you're sure you don't want this data anymore.
-- The OTP system has been removed from both apps (no more send-otp /
-- verify-otp edge functions, no OTP step in the booking flow). This
-- table is no longer written to or read from anywhere, so it's safe to
-- drop. Skip this if you'd rather keep the historical records.

drop table if exists otp_verifications;
