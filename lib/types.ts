/* ============================================================
   PUNKU — Tipos del dominio (Expediente Territorial)
   Hereda de spec 02 (modelo de datos).
   ============================================================ */
import type { CatId, EstadoId, Urgencia } from "./punku-data";

/** Entrada ANONIMIZADA al motor de IA (spec 03). NUNCA incluye datos personales. */
export interface NecesidadInput {
  area: string;         // categoría elegida en el árbol (etiqueta ciudadana)
  catId: CatId;         // id de categoría (para el fallback por reglas)
  quePasa: string;      // problema elegido (paso B)
  distrito: string;
  familias: number;
  aspiracion: string;   // "qué quieren lograr" (paso E)
  urgenciaCiudadana: string; // alta / anio / espera (paso E)
  relato: string;       // texto libre opcional (paso D)
  emergencia: boolean;  // vino por PUNKU Emergencias
}

/** Salida estructurada del motor de IA (spec 03). */
export interface ClasificacionIA {
  /** ¿El input describe una necesidad comunitaria real y comprensible?
   *  Si es false, NO se inventa contenido: el flujo se detiene y se pide reescribir. */
  coherente: boolean;
  /** Motivo breve cuando coherente=false (para mostrar al usuario). */
  motivo: string;
  categoria: CatId;
  modalidad: "monovalente" | "polivalente";
  urgencia: "normal" | "alta";
  facultades_sugeridas: string[];
  ods_sugerido: string;
  resumen_formal: string;
  objetivo_sugerido: string;
  meta_sugerida: string;
  confianza: number;            // 0..1
  clasificado_por: "ia" | "reglas";
}

/** Resultado de una sugerencia de campo de B4 ("Sugerir con IA"). */
export interface SugerenciaB4 {
  coherente: boolean;
  texto: string;   // el texto sugerido si coherente
  motivo: string;  // por qué no, si !coherente
  generado_por: "ia" | "plantilla";
}

/** Datos de contacto SENSIBLES (tabla separada — nunca van a la IA, spec 02/06). */
export interface ContactoInput {
  nombre_representante: string;
  telefono: string;
  comunidad: string;
  es_facilitador: boolean;
}

/** Expediente Territorial completo (lo que persiste, spec 02). */
export interface Expediente {
  codigo: string;
  comunidad: string;
  distrito: string;
  familias_afectadas: number;
  necesidad_texto: string;
  categoria: CatId;
  facultades_sugeridas: string[];
  ods_sugerido: string;
  resultado_deseado: string;
  urgencia_ciudadana: string;
  foto_url: string | null;
  modalidad: string;
  urgencia: Urgencia;
  resumen_formal: string;
  estado: EstadoId;
  canal_origen: string;     // web / emergencias / asistido
  origen_registro: string;  // ciudadano / facilitador
  clasificado_por: "ia" | "reglas";
  confianza: number;
  titulo: string;
  objetivo_sugerido: string;
  meta_sugerida: string;
  creado_en: string;
  actualizado_en: string;
}

/** Entrada en el historial de estados (timeline, spec 02). */
export interface EstadoHistorial {
  estado: EstadoId;
  nota: string;
  fecha: string;
}

/** Vista pública para la consulta ciudadana por código (A5).
 *  Solo campos NO sensibles — nunca el contacto (spec 02 §7, spec 06). */
export interface ConsultaPublica {
  codigo: string;
  comunidad: string;
  distrito: string;
  categoria: CatId;
  familias_afectadas: number;
  resumen_formal: string;
  estado: EstadoId;
  urgencia: Urgencia;
  historial: EstadoHistorial[];
}

/** Lo que devuelve el POST de creación al front: solo la Tarjeta de Reconocimiento.
 *  NUNCA el contacto (spec 06, regla de aislamiento). */
export interface TarjetaReconocimiento {
  codigo: string;
  area: string;          // etiqueta de categoría
  categoria: CatId;      // para el ícono
  familias: number;
  resumen: string;
  urgente: boolean;
  clasificado_por: "ia" | "reglas";
}
