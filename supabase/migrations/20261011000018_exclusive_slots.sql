-- Ábaco del Tiempo · Cada espacio se ocupa una sola vez
--
--   · Documento de entrega: uno por fase (ya era así: phase_deliverables.phase_id es único).
--   · Recurso digital: uno por fase.
--   · Video o entrevista: uno por fase.
--   · Línea de tiempo: una sola en todo el portafolio.
-- Cuando alguien ocupa un espacio, nadie más puede subir otro igual; quien lo subió (o Rosa) puede editarlo o reemplazarlo.
-- Estas reglas viven en la base: no dependen de lo que muestre u oculte la página.

-- Un recurso o un video siempre pertenece a una fase (la línea de tiempo es la excepción: no tiene fase).
alter table public.resources
  add constraint resources_phase_required check (kind = 'timeline' or phase_id is not null);
alter table public.videos
  add constraint videos_phase_required check (phase_id is not null);

create unique index resources_one_per_phase on public.resources (phase_id) where kind <> 'timeline';
create unique index resources_one_timeline on public.resources ((true)) where kind = 'timeline';
create unique index videos_one_per_phase on public.videos (phase_id);
