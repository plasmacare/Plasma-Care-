-- OPTIONAL maintenance — not required, safe to run whenever you like.
-- This does NOT touch bookings, patients, payments, or anything
-- business-critical. It only prunes two tables that grow forever by
-- design and have no automatic cleanup:
--
--   activity_logs  — the Dev Pulse error/action log (every uncaught JS
--                    error site-wide gets logged here automatically)
--   page_views     — one row per page view, used for the Views tab
--
-- Neither of these is "cache" in the phone-app sense — there's nothing
-- to clear that regenerates itself. This just deletes OLD ROWS you
-- don't need anymore. Adjust the interval if you want to keep more or
-- less history before running.

delete from activity_logs where created_at < now() - interval '30 days';
delete from page_views where created_at < now() - interval '90 days';

-- After deleting a lot of rows, reclaim the freed disk space:
vacuum (full, analyze) activity_logs;
vacuum (full, analyze) page_views;
