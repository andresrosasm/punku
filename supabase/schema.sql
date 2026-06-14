-- ============================================================
-- PUNKU — Esquema de base de datos (Supabase / PostgreSQL)
-- Specs 02 (modelo de datos) y 06 (seguridad / RLS).
--
-- Para producción: ejecutar este script en el SQL Editor de Supabase.
-- El MVP de demo funciona con un almacén en memoria (lib/store.ts) y NO
-- requiere Supabase; este esquema deja el camino listo para el piloto.
--
-- Principio rector (spec 02 §2): separar dato sensible (contactos) de dato
-- procesable. La IA solo recibe la necesidad anonimizada; los contactos viven
-- en su propia tabla, accesible solo por el rol interno (service_role).
-- ============================================================

-- ---------- Expedientes (el Expediente Territorial — corazón del sistema) ----------
create table if not exists public.expedientes (
  id                  uuid primary key default gen_random_uuid(),
  codigo              text unique not null,                 -- PUNKU-2026-NNN
  comunidad           text not null,
  distrito            text not null,
  familias_afectadas  int  not null default 0,
  necesidad_texto     text,                                 -- lo que va a la IA (anonimizado)
  categoria           text not null,                        -- agro/salud/educ/agua/cultura/infra
  facultades_sugeridas text[] not null default '{}',
  ods_sugerido        text,
  resultado_deseado   text,                                 -- paso E (aspiración ciudadana)
  urgencia_ciudadana  text,                                 -- alta/anio/espera
  foto_url            text,
  modalidad           text,                                 -- monovalente/polivalente
  urgencia            text not null default 'baja',         -- baja/media/alta
  resumen_formal      text,
  estado              text not null default 'recibido',     -- recibido/revision/derivado/atendido/cerrado
  canal_origen        text not null default 'web',          -- web/emergencias/asistido
  origen_registro     text not null default 'ciudadano',    -- ciudadano/facilitador
  clasificado_por     text not null default 'ia',           -- ia/reglas
  confianza           float default 0,
  titulo              text,
  objetivo_sugerido   text,
  meta_sugerida       text,
  datos_incompletos   boolean not null default false,       -- aviso interno (panel)
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now()
);

-- ---------- Contactos (datos SENSIBLES — aislados, spec 02 §3 / 06) ----------
create table if not exists public.contactos (
  id                   uuid primary key default gen_random_uuid(),
  expediente_id        uuid references public.expedientes(id) on delete cascade,
  nombre_representante text,
  telefono             text,
  es_facilitador       boolean not null default false
);

-- ---------- Historial de estados (timeline / trazabilidad, spec 02 §3) ----------
create table if not exists public.estados_historial (
  id            uuid primary key default gen_random_uuid(),
  expediente_id uuid references public.expedientes(id) on delete cascade,
  estado        text not null,
  nota          text,
  fecha         timestamptz not null default now()
);

-- ---------- Catálogos ----------
create table if not exists public.facultades (
  id            int generated always as identity primary key,
  nombre        text not null,
  area          text,
  palabras_clave text[] default '{}'
);

create table if not exists public.ods_facultad (
  ods_numero   int,
  ods_nombre   text,
  facultades   text[] default '{}',
  es_transversal boolean default false
);

-- ---------- Borrador del formato UNCP de B4 (1:1 con expedientes) ----------
-- Lo que la UNCP completa en B4 (objetivo, específicos, metas, etc.). Tabla aparte
-- para no tocar `expedientes`. Ver supabase/migration-borradores-b4.sql.
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
  estudiantes            jsonb not null default '[]'::jsonb,
  actualizado_en         timestamptz not null default now()
);
create index if not exists idx_borradores_b4_expediente on public.borradores_b4(expediente_id);

-- ============================================================
-- Row Level Security (spec 06, regla de oro #3)
-- ============================================================
alter table public.expedientes      enable row level security;
alter table public.contactos        enable row level security;
alter table public.estados_historial enable row level security;
alter table public.facultades       enable row level security;
alter table public.ods_facultad     enable row level security;
alter table public.borradores_b4    enable row level security; -- interna: solo service_role

-- Lectura pública SOLO de campos no sensibles del expediente (consulta por código, A5).
-- Nota: el frontend público usa la anon key; toda escritura pasa por API routes con
-- service_role (server-side). Por eso aquí solo habilitamos SELECT público acotado.
drop policy if exists "lectura publica expedientes" on public.expedientes;
create policy "lectura publica expedientes"
  on public.expedientes for select
  to anon using (true);

drop policy if exists "lectura publica historial" on public.estados_historial;
create policy "lectura publica historial"
  on public.estados_historial for select
  to anon using (true);

-- Catálogos: lectura pública.
drop policy if exists "lectura catalogo facultades" on public.facultades;
create policy "lectura catalogo facultades" on public.facultades for select to anon using (true);
drop policy if exists "lectura catalogo ods" on public.ods_facultad;
create policy "lectura catalogo ods" on public.ods_facultad for select to anon using (true);

-- contactos: SIN política para anon -> RLS bloquea todo acceso desde el frontend.
-- Solo el service_role (que bypassa RLS, usado únicamente en API routes server-side)
-- puede leer/escribir contactos. spec 02 §7 / spec 06.

-- ============================================================
-- Índices útiles
-- ============================================================
create index if not exists idx_expedientes_codigo on public.expedientes(codigo);
create index if not exists idx_expedientes_estado on public.expedientes(estado);
create index if not exists idx_historial_expediente on public.estados_historial(expediente_id);
