-- Run in Supabase SQL editor. Additive — doesn't remove any existing
-- policy. Needed because the plain "Assigned staff" dropdown (lab-visit
-- bookings) needs to list colleague names, but only Admin could
-- previously read other people's staff_profiles rows.
--
-- Postgres combines multiple permissive SELECT policies with OR, so
-- this only adds visibility — it doesn't loosen anything else (Access
-- tab edits, developer-hiding, etc. all still apply as before).

drop policy if exists "staff can see active colleague names" on staff_profiles;
create policy "staff can see active colleague names"
  on staff_profiles for select
  to authenticated
  using (current_staff_role() is not null and role <> 'developer' and is_active = true);
