-- ============================================================
-- PUNKU — Migración: flag "listo para derivar" en el borrador B4
-- ------------------------------------------------------------
-- Marca cuándo la solicitud B4 quedó lista para derivar a la facultad.
-- Solo lo activa el botón "Guardar y volver para derivar" del footer de B4.
-- Columna NUEVA en la tabla `borradores_b4` (1:1). NO toca `expedientes`
-- ni ninguna columna existente. Idempotente; rollback trivial.
-- ============================================================
alter table public.borradores_b4
  add column if not exists listo_para_derivar boolean not null default false;

-- Rollback (si hiciera falta):
--   alter table public.borradores_b4 drop column if exists listo_para_derivar;
