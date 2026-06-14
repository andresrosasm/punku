-- ============================================================
-- Rollback: elimina la tabla `borradores_b4`
-- ============================================================
-- Deja `expedientes` y el resto del esquema intactos. La app vuelve a funcionar
-- con el estado de sesión como capa de UX (sin persistir el borrador).

drop table if exists public.borradores_b4;
