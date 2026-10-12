-- Ábaco del Tiempo · Textos de espera más amables
--
-- Donde todavía dice «[Por completar]» se muestra un texto pensado para el visitante. Solo se cambian los
-- valores que siguen siendo el marcador original: lo que alguien ya escribió no se toca.

-- Datos generales
update public.site_config set teacher = 'Próximamente' where teacher = '[Por completar]';
update public.site_config set period = 'Próximamente' where period = '[Por completar]';
update public.site_config set group_name = 'Próximamente' where group_name = '[Por completar]';
update public.site_config set timeline_learned = 'Muy pronto compartiremos aquí lo que aprendimos con la línea de tiempo.'
  where timeline_learned = '[Por completar]';
update public.site_config set reflection_knowledge = 'Muy pronto compartiremos aquí lo que aprendimos sobre la temática.'
  where reflection_knowledge = '[Por completar]';
update public.site_config set reflection_skills = 'Muy pronto compartiremos aquí lo que aprendimos a hacer.'
  where reflection_skills = '[Por completar]';
update public.site_config set reflection_experience = 'Muy pronto compartiremos aquí lo que nos dejó el proceso.'
  where reflection_experience = '[Por completar]';

-- Fases
update public.phases set description = 'La actividad de esta fase se publicará muy pronto.' where description = '[Por completar]';
update public.phases set que_aprendimos = 'Muy pronto compartiremos aquí lo que aprendimos en esta fase.' where que_aprendimos = '[Por completar]';

-- Integrantes
update public.members set role = 'Próximamente' where role = '[Por completar]';
update public.members set contribution = 'Muy pronto compartiremos su aporte al proyecto.' where contribution = '[Por completar]';

-- Que las filas nuevas también nazcan con el texto amable
alter table public.site_config alter column teacher set default 'Próximamente';
alter table public.site_config alter column period set default 'Próximamente';
alter table public.site_config alter column group_name set default 'Próximamente';
alter table public.site_config alter column timeline_learned set default 'Muy pronto compartiremos aquí lo que aprendimos con la línea de tiempo.';
alter table public.site_config alter column reflection_knowledge set default 'Muy pronto compartiremos aquí lo que aprendimos sobre la temática.';
alter table public.site_config alter column reflection_skills set default 'Muy pronto compartiremos aquí lo que aprendimos a hacer.';
alter table public.site_config alter column reflection_experience set default 'Muy pronto compartiremos aquí lo que nos dejó el proceso.';
alter table public.phases alter column description set default 'La actividad de esta fase se publicará muy pronto.';
alter table public.phases alter column que_aprendimos set default 'Muy pronto compartiremos aquí lo que aprendimos en esta fase.';
alter table public.members alter column role set default 'Próximamente';
alter table public.members alter column contribution set default 'Muy pronto compartiremos su aporte al proyecto.';
