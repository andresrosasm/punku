-- ============================================================
-- Migración: columna `datos_incompletos` en `expedientes`
-- ============================================================
-- Aviso interno (solo panel): la clasificación detectó coherencia baja / datos
-- pobres. NO bloquea nada — sugiere al coordinador contactar al ciudadano.
--
-- Si tu base de Supabase ya tiene datos (producción), ejecuta esto UNA vez en
-- Supabase → SQL Editor, ANTES de que el nuevo deploy cree expedientes
-- (de lo contrario los INSERT fallarán por columna inexistente).

alter table public.expedientes
  add column if not exists datos_incompletos boolean not null default false;
