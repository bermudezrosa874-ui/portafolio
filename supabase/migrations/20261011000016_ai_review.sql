-- Ábaco del Tiempo · Revisión automática de aportes
--
-- Los aportes de los colaboradores nacen «pendientes» y una función del servidor (review-contribution) los analiza:
-- si están bien los publica; si no, los deja pendientes con el motivo en review_note para que Rosa decida.
-- review_sig es una huella del contenido revisado: evita pagar dos veces por revisar lo mismo.
alter table public.contributions
  add column if not exists review_note text,
  add column if not exists review_sig text;
