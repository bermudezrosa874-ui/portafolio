-- Dimensiones de las imágenes de la galería: permiten reservar el espacio exacto
-- antes de que cargue la imagen (evita saltos de diseño, CLS). Las completa el panel al subir.
alter table public.evidences
  add column width  int check (width  is null or (width  > 0 and width  <= 10000)),
  add column height int check (height is null or (height > 0 and height <= 10000));
