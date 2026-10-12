-- Ábaco del Tiempo · Cada fase lleva su propio RAC: la fase 4 es RAC 4 y la fase 5 es RAC 5.
update public.phases set rac = 'RAC 4' where id = 4;
update public.phases set rac = 'RAC 5' where id = 5;
