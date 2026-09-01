create policy "project_media_public_read" on storage.objects
  for select using (bucket_id = 'project-media');
create policy "project_media_staff_insert" on storage.objects
  for insert with check (bucket_id = 'project-media' and public.is_staff());
create policy "project_media_staff_update" on storage.objects
  for update
  using (bucket_id = 'project-media' and public.is_staff())
  with check (bucket_id = 'project-media' and public.is_staff());
create policy "project_media_staff_delete" on storage.objects
  for delete using (bucket_id = 'project-media' and public.is_staff());