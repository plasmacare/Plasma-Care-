-- Run this once in the Supabase SQL editor.
--
-- Lets a logged-in staff/B2B account update ONE thing about their own
-- row (full_name for staff; address/latitude/longitude for B2B) so the
-- new "complete your profile" gate can work — previously only admin
-- could UPDATE these tables at all, so a non-admin trying to fill in
-- their own missing field would have been silently blocked by RLS.
--
-- The row-level "own row" policy alone isn't enough on its own,
-- though — without something else in place, that same policy would
-- also let a non-admin staff member change their own `role` or
-- `allowed_tabs` (or a B2B account flip its own `is_active`) via a
-- raw API call, even though the app's own UI never does that. A
-- trigger closes that gap by rejecting any self-update that touches a
-- column outside the specific ones each account type is allowed to
-- change themselves.

create or replace function prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admins go through their own separate "admin manages ..." policy
  -- (which this trigger doesn't need to touch), but the trigger fires
  -- for every UPDATE regardless of which policy allowed it — so admins
  -- must be explicitly exempted here too, or they'd hit the same block.
  if current_staff_role() = 'admin' then
    return new;
  end if;

  if TG_TABLE_NAME = 'staff_profiles' then
    if new.role is distinct from old.role
      or new.allowed_tabs is distinct from old.allowed_tabs
      or new.is_active is distinct from old.is_active
      or new.email is distinct from old.email
    then
      raise exception 'Only admin can change role, access, active status, or email.';
    end if;
  elsif TG_TABLE_NAME = 'b2b_accounts' then
    if new.company_name is distinct from old.company_name
      or new.contact_name is distinct from old.contact_name
      or new.email is distinct from old.email
      or new.phone is distinct from old.phone
      or new.username is distinct from old.username
      or new.gstin is distinct from old.gstin
      or new.is_active is distinct from old.is_active
      or new.mou_url is distinct from old.mou_url
    then
      raise exception 'Only admin can change company details — contact admin instead.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists staff_profiles_no_self_escalation on staff_profiles;
create trigger staff_profiles_no_self_escalation
  before update on staff_profiles
  for each row execute function prevent_self_privilege_escalation();

drop trigger if exists b2b_accounts_no_self_escalation on b2b_accounts;
create trigger b2b_accounts_no_self_escalation
  before update on b2b_accounts
  for each row execute function prevent_self_privilege_escalation();

drop policy if exists "staff can update own row" on staff_profiles;
create policy "staff can update own row"
  on staff_profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "b2b can update own row" on b2b_accounts;
create policy "b2b can update own row"
  on b2b_accounts for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
