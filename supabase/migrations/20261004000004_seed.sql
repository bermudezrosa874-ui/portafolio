-- Ábaco del Tiempo · Datos iniciales
-- Lo que no se conoce queda como [Por completar] y se edita desde /admin.

insert into public.site_config (
  id, intro_text, purpose, general_objective, specific_objectives,
  timeline_text, videos_intro, group_reflection, team_text
) values (
  1,
  'Este portafolio digital reúne los principales productos académicos desarrollados durante el proceso formativo. Cada recurso evidencia la evolución de nuestros aprendizajes mediante la investigación, la creatividad, el análisis y el uso de herramientas digitales.',
  'El portafolio tiene como finalidad recopilar, organizar y presentar de manera interactiva los productos académicos desarrollados durante las diferentes fases del curso, permitiendo evidenciar los aprendizajes alcanzados y el proceso de construcción del conocimiento.',
  'Presentar de manera organizada, creativa e interactiva los aprendizajes y productos académicos desarrollados durante el proceso formativo.',
  '["Integrar los productos realizados durante las diferentes fases.",
    "Evidenciar el progreso del aprendizaje.",
    "Utilizar herramientas digitales como medio de comunicación académica.",
    "Facilitar la consulta de los recursos creados.",
    "Promover una presentación visual, organizada e interactiva del conocimiento."]'::jsonb,
  'Este recurso presenta de manera cronológica los principales acontecimientos, personajes y aportes estudiados durante el desarrollo de la asignatura. Su organización permite comprender la evolución histórica de los conceptos y establecer relaciones entre los diferentes acontecimientos.',
  'A través de esta entrevista se presenta una aproximación creativa a los personajes, acontecimientos e ideas estudiadas, utilizando el formato audiovisual como estrategia para comunicar el conocimiento de una manera dinámica y comprensible.',
  'La construcción de este portafolio permitió integrar diferentes formas de representar el conocimiento. El desarrollo de líneas de tiempo, entrevistas, recursos interactivos y materiales audiovisuales fortaleció no solamente la comprensión de los contenidos académicos, sino también competencias relacionadas con investigación, comunicación, creatividad, trabajo colaborativo y uso de herramientas digitales.',
  'Este proyecto fue desarrollado mediante el trabajo colaborativo de los integrantes del grupo, quienes participaron en las diferentes etapas de investigación, diseño, producción y construcción de los recursos académicos.'
)
on conflict (id) do nothing;

insert into public.moments (id, title, color, position) values
  ('inicial',    'Momento inicial',    '#06B6D4', 1),
  ('intermedio', 'Momento intermedio', '#7C3AED', 2),
  ('final',      'Momento final',      '#F5B942', 3)
on conflict (id) do nothing;

insert into public.phases (id, moment_id, title, rac, position) values
  (1, 'inicial',    'Explorando los orígenes de las matemáticas',              'RAC 1', 1),
  (2, 'intermedio', 'Investigando las civilizaciones y los grandes pensadores', 'RAC 2', 2),
  (3, 'intermedio', 'Construyendo el patrimonio histórico de las matemáticas',  'RAC 3', 3),
  (4, 'intermedio', 'Comunicando el conocimiento histórico-matemático',         'RAC 3', 4),
  (5, 'final',      'Socializando el patrimonio histórico de las matemáticas',  'RAC 4', 5)
on conflict (id) do nothing;

insert into public.members (name, topic, position)
select v.name, v.topic, v.position
from (values
  ('Rosalinda Bermúdez',                          'Arquímedes de Siracusa', 1),
  ('Johana Lemus',                                'Egipto',                 2),
  ('Luis Fernando [apellido por completar]',      'Tales de Mileto',        3),
  ('Juan Stiven [apellido por completar]',        'Zenón de Elea',          4),
  ('[Integrante 5 por completar]',                'Mesopotamia',            5)
) as v(name, topic, position)
where not exists (select 1 from public.members);

-- Correo de administración: al existir la cuenta, recibe rol admin y se enlaza a su ficha.
insert into public.member_emails (email, member_id, grant_admin)
select 'bermudezrosa874@gmail.com', id, true
from public.members where topic = 'Arquímedes de Siracusa'
on conflict (email) do nothing;

-- La cuenta de Rosalinda ya existe en Auth: aplicar el enlace ahora.
select private.link_user(u.id, u.email)
from auth.users u
where lower(u.email) = 'bermudezrosa874@gmail.com';

-- Preguntas del quiz (hechos históricos; se pueden editar desde /admin)
insert into public.quiz_questions (question, options, correct_index, explanation, topic, position)
select * from (values
  ('¿Quién es famoso por medir la altura de una pirámide usando su sombra?',
   '["Tales de Mileto","Zenón de Elea","Arquímedes de Siracusa","Ahmes"]'::jsonb, 0,
   'Según la tradición, Tales usó la semejanza entre su sombra y la de la pirámide para estimar su altura.',
   'Tales de Mileto', 1),
  ('¿A quién se atribuyen la paradoja de Aquiles y la tortuga?',
   '["Tales de Mileto","Zenón de Elea","Pitágoras","Euclides"]'::jsonb, 1,
   'Zenón de Elea planteó paradojas sobre el movimiento y el infinito.',
   'Zenón de Elea', 2),
  ('¿Quién acotó el valor de π entre 3 10/71 y 3 1/7 usando polígonos de 96 lados?',
   '["Ahmes","Tales de Mileto","Arquímedes de Siracusa","Zenón de Elea"]'::jsonb, 2,
   'Arquímedes usó polígonos inscritos y circunscritos a la circunferencia.',
   'Arquímedes de Siracusa', 3),
  ('¿Qué civilización desarrolló un sistema de numeración sexagesimal (base 60)?',
   '["Egipto","Grecia","Mesopotamia","Roma"]'::jsonb, 2,
   'Los babilonios usaron base 60, herencia que seguimos usando al medir el tiempo y los ángulos.',
   'Mesopotamia', 4),
  ('¿De qué civilización es el Papiro de Rhind, escrito por el escriba Ahmes?',
   '["Mesopotamia","Egipto","Grecia","India"]'::jsonb, 1,
   'El Papiro de Rhind es una de las principales fuentes sobre las matemáticas del antiguo Egipto.',
   'Egipto', 5)
) as q(question, options, correct_index, explanation, topic, position)
where not exists (select 1 from public.quiz_questions);
