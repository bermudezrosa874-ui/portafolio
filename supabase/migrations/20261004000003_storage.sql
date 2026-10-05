-- Ábaco del Tiempo · Buckets de Storage
-- Los buckets son públicos para LECTURA por URL directa (no hay política de listado).
-- La escritura exige sesión y rol. Tamaño y tipo MIME los impone el bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('deliverables', 'deliverables', true, 20971520,
    array['application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('evidences', 'evidences', true, 8388608,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('members', 'members', true, 8388608,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('covers', 'covers', true, 8388608,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Subir: admin en cualquier bucket; integrante solo en "evidences", dentro de su carpeta <uid>/
create policy "subir archivos" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('deliverables', 'evidences', 'members', 'covers')
    and (
      (select private.is_admin())
      or (
        bucket_id = 'evidences'
        and (select private.is_member())
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
    )
  );

-- Reemplazar: solo admin
create policy "actualizar archivos" on storage.objects for update to authenticated
  using (
    bucket_id in ('deliverables', 'evidences', 'members', 'covers')
    and (select private.is_admin())
  )
  with check (
    bucket_id in ('deliverables', 'evidences', 'members', 'covers')
    and (select private.is_admin())
  );

-- Eliminar: admin; el integrante solo sus propias evidencias
create policy "eliminar archivos" on storage.objects for delete to authenticated
  using (
    bucket_id in ('deliverables', 'evidences', 'members', 'covers')
    and (
      (select private.is_admin())
      or (bucket_id = 'evidences' and owner_id = (select auth.uid())::text)
    )
  );
