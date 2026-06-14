-- ============================================================
-- Migración: tabla `borradores_b4` (borrador del formato UNCP de B4)
-- ============================================================
-- Persiste lo que la UNCP completa en B4 (objetivo, específicos, metas, etc.).
-- Tabla NUEVA y SEPARADA, relación 1:1 con expedientes — NO toca la tabla crítica
-- `expedientes`, así el rollback es limpio (DROP TABLE).
--
-- Ejecutar UNA vez en Supabase → SQL Editor, ANTES del push del nuevo deploy.

create table if not exists public.borradores_b4 (
  id                     uuid primary key default gen_random_uuid(),
  expediente_id          uuid not null unique references public.expedientes(id) on delete cascade,
  objetivo_general       text,
  objetivos_especificos  text,
  metas                  text,
  metodologia            text,
  fecha_ini              date,
  fecha_fin              date,
  recursos               text,
  presupuesto            text,
  docente_asesor         text,
  evaluacion             text,
  estudiantes            jsonb not null default '[]'::jsonb,  -- array de {nombre,dni,codigo}
  actualizado_en         timestamptz not null default now()
);

create index if not exists idx_borradores_b4_expediente on public.borradores_b4(expediente_id);

-- RLS: tabla interna. Solo el service_role (backend) lee/escribe; service_role
-- bypassa RLS. Sin políticas para anon -> RLS bloquea todo acceso desde el frontend.
alter table public.borradores_b4 enable row level security;
