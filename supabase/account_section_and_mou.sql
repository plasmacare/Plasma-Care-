-- Run this once in the Supabase SQL editor.
-- MoU document shown in a B2B account's Account section. Admin uploads
-- it (from the B2B Requests tab, on an approved company); the company
-- can only view/download it, not edit it.

alter table b2b_accounts
  add column if not exists mou_url text;

insert into storage.buckets (id, name, public)
values ('mou-documents', 'mou-documents', true)
on conflict (id) do update set public = true;

drop policy if exists "Admins can upload MoU documents" on storage.objects;
create policy "Admins can upload MoU documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'mou-documents' and current_staff_role() in ('admin', 'staff'));

drop policy if exists "Public can read MoU documents" on storage.objects;
create policy "Public can read MoU documents"
  on storage.objects for select
  to public
  using (bucket_id = 'mou-documents');
