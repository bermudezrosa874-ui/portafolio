-- Ábaco del Tiempo · Lectura restringida de objetos de Storage
--
-- La API de Storage necesita LEER un objeto antes de borrarlo o reemplazarlo, por lo que sin
-- una política SELECT ni el administrador podía quitar archivos (quedaban huérfanos).
--
-- Los buckets siguen siendo públicos para ver archivos por su URL directa (eso no usa esta
-- política). Esta política NO permite listar a los visitantes: solo administración ve todo, y un
-- integrante solo ve sus propias imágenes de "evidences".

create policy "ver archivos propios o admin" on storage.objects for select to authenticated
  using (
    bucket_id in ('deliverables', 'evidences', 'members', 'covers')
    and (
      (select private.is_admin())
      or (bucket_id = 'evidences' and owner_id = (select auth.uid())::text)
    )
  );
