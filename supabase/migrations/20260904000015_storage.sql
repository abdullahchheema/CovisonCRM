-- A single private bucket for now (company logos, contact file attachments,
-- etc.), partitioned by organization via the object key's first path
-- segment: {org_id}/{entity}/{id}/{filename}. Storage RLS is a separate
-- policy surface from table RLS — easy to forget, so it's set up here
-- alongside the schema rather than deferred.
insert into storage.buckets (id, name, public)
values ('org-files', 'org-files', false)
on conflict (id) do nothing;

create policy org_files_select on storage.objects for select to authenticated
  using (
    bucket_id = 'org-files'
    and (storage.foldername(name))[1] = (select public.current_org_id())::text
  );

create policy org_files_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'org-files'
    and (storage.foldername(name))[1] = (select public.current_org_id())::text
  );

create policy org_files_update on storage.objects for update to authenticated
  using (
    bucket_id = 'org-files'
    and (storage.foldername(name))[1] = (select public.current_org_id())::text
  )
  with check (
    bucket_id = 'org-files'
    and (storage.foldername(name))[1] = (select public.current_org_id())::text
  );

create policy org_files_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'org-files'
    and (storage.foldername(name))[1] = (select public.current_org_id())::text
  );
