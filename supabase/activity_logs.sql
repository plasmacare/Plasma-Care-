-- Run in Supabase SQL editor. This is the site-wide activity + error
-- log ("nervous system") — every layer (customer, staff, admin, B2B,
-- and uncaught JS errors) writes here through one shared helper
-- (src/lib/telemetry.js -> logEvent()). Only the 'developer' role can
-- read it; the Dev Pulse page in the app is the only place it's shown.

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,        -- e.g. 'js_error', 'login', 'booking_created', 'admin_action'
  source text not null,            -- 'customer' | 'staff' | 'admin' | 'b2b' | 'system'
  severity text not null default 'info', -- 'info' | 'warning' | 'error'
  actor_id uuid,                   -- auth.uid() if logged in, null for anonymous customers
  actor_label text,                -- email or a human label, denormalized so logs stay
                                    -- readable even after a user is deleted
  message text not null,
  metadata jsonb,
  path text,                       -- route/page the event happened on
  session_id text,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx on activity_logs (created_at desc);
create index if not exists activity_logs_severity_idx on activity_logs (severity);
create index if not exists activity_logs_source_idx on activity_logs (source);

alter table activity_logs enable row level security;

-- Anyone (including anonymous customers) can write a log entry — this
-- is how customer-side errors and actions reach the log at all.
drop policy if exists "anyone can insert logs" on activity_logs;
create policy "anyone can insert logs"
  on activity_logs for insert
  to anon, authenticated
  with check (true);

-- Only role='developer' can read. Note: this is intentionally NOT
-- 'admin' — the developer role is separate and admin does not
-- automatically get access to this table.
drop policy if exists "developer reads all logs" on activity_logs;
create policy "developer reads all logs"
  on activity_logs for select
  to authenticated
  using (current_staff_role() = 'developer');

-- Housekeeping: logs older than 90 days can be pruned. Run manually or
-- wire up as a pg_cron job later — not scheduled automatically here.
-- delete from activity_logs where created_at < now() - interval '90 days';

-- NOTE: to create the first developer account, add a user the same way
-- as staff (Authentication -> Users), then set their staff_profiles.role
-- to 'developer' (Table Editor, same as the admin bootstrap step).
-- The developer role also requires 2FA, same as admin — they'll hit the
-- same /portal/mfa/enroll flow on first login.
