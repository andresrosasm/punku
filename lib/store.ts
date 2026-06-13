/* ============================================================
   PUNKU — Capa de datos (facade)  ·  specs 02, 04, 05
   ------------------------------------------------------------
   Elige la implementación según el entorno, en CADA llamada:
   · Hay Supabase configurado  -> store-supabase (persistente, producción).
   · No hay Supabase           -> store-memory  (en memoria, demo sin setup).
   Las API routes y el frontend no cambian: misma interfaz async.
   ============================================================ */
import { hasSupabase } from "./supabase";
import * as mem from "./store-memory";
import * as sb from "./store-supabase";
import type {
  Expediente, EstadoHistorial, ConsultaPublica, ContactoInput,
  NecesidadInput, ClasificacionIA, TarjetaReconocimiento,
} from "./types";
import type { EstadoId } from "./punku-data";

function impl() {
  return hasSupabase() ? sb : mem;
}

export function crearExpediente(input: NecesidadInput, ia: ClasificacionIA, contacto: ContactoInput, foto_url: string | null): Promise<TarjetaReconocimiento> {
  return impl().crearExpediente(input, ia, contacto, foto_url);
}
export function consultarPorCodigo(codigo: string): Promise<ConsultaPublica | null> {
  return impl().consultarPorCodigo(codigo);
}
export function listarExpedientes(): Promise<Expediente[]> {
  return impl().listarExpedientes();
}
export function obtenerExpediente(codigo: string): Promise<{ expediente: Expediente; historial: EstadoHistorial[] } | null> {
  return impl().obtenerExpediente(codigo);
}
export function cambiarEstado(codigo: string, estado: EstadoId, nota: string): Promise<Expediente | null> {
  return impl().cambiarEstado(codigo, estado, nota);
}
export function revelarContacto(codigo: string): Promise<ContactoInput | null> {
  return impl().revelarContacto(codigo);
}
