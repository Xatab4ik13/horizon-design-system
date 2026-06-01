insert into storage.buckets (id, name, public)
values ('site-documents', 'site-documents', true)
on conflict (id) do nothing;

drop policy if exists "Public read site-documents" on storage.objects;
create policy "Public read site-documents"
on storage.objects for select
to public
using (bucket_id = 'site-documents');