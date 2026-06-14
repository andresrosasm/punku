-- ============================================================
-- PUNKU — Reset de datos de demo (opcional)
-- ============================================================
-- Vacía las tablas de expedientes y sus dependientes. La próxima vez que la app
-- toque Supabase, vuelve a sembrar AUTOMÁTICAMENTE los 7 expedientes ficticios
-- (siembra idempotente en lib/store-supabase.ts). Útil para dejar la bandeja
-- prístina antes de la demo del jurado, tras pruebas.
--
-- Ejecutar en Supabase → SQL Editor:

truncate table public.estados_historial, public.contactos, public.expedientes restart identity cascade;

-- Luego abre la app (o /panel) una vez: se re-siembran los 7 ficticios.
