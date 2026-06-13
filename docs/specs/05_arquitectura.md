# 05 — Arquitectura
## Cómo encaja todo: Next.js + Supabase + Vercel

> Hereda de `00`–`04`. Define la arquitectura técnica, el flujo end-to-end y por qué cada decisión. Es la guía para Claude Code.

---

## 1. Principio rector de la arquitectura

**Simple, por capas, con la IA aislada.** Una sola aplicación Next.js que sirve las dos caras (ciudadana e interna), con Supabase como base de datos y el motor de IA detrás de una interfaz reemplazable. Nada de microservicios ni complejidad innecesaria para un MVP.

## 2. Las capas

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (Next.js + Tailwind + shadcn/ui)           │
│  · Cara ciudadana: árbol, emergencias, tarjeta, etc. │
│  · Cara interna: CRM (bandeja, detalle)              │
└───────────────┬─────────────────────────────────────┘
                │ (llamadas a API routes, nunca llaves en cliente)
┌───────────────▼─────────────────────────────────────┐
│  BACKEND (Next.js API Routes — server-side)          │
│  · Crea expedientes · genera código · cambia estados │
│  · Llama al motor de IA (con la key, en servidor)    │
│  · Único que accede a datos sensibles                │
└──────┬────────────────────────────┬──────────────────┘
       │                            │
┌──────▼─────────┐        ┌─────────▼──────────────────┐
│  MOTOR DE IA    │        │  SUPABASE (PostgreSQL)     │
│  (interfaz      │        │  expedientes · contactos   │
│   aislada)      │        │  estados_historial         │
│  Claude Haiku   │        │  facultades                │
│  → DeepSeek/    │        │  RLS activado              │
│   Huawei (prod) │        └────────────────────────────┘
│  + fallback     │
│   reglas        │
└─────────────────┘
```

## 3. Regla de aislamiento (seguridad)

- **El frontend NUNCA toca las llaves** (ni la de IA ni la service_role de Supabase). Todas las operaciones sensibles pasan por las API routes (server-side).
- **El motor de IA está tras una interfaz** `estructurarNecesidad(input) → Expediente`. Migrar de Claude a DeepSeek/Huawei = cambiar solo esa implementación. (Ver spec 03.)
- **Los datos sensibles** (contactos) solo se leen/escriben desde el backend con service role. El frontend usa la anon key protegida por RLS.

## 4. Flujo end-to-end (ejemplo completo)

```
1. Genaro abre la URL (sin login) → cara ciudadana
2. Recorre el árbol visual + texto libre → frontend arma el input
3. Frontend llama a /api/expedientes (POST) con la necesidad
4. API route (servidor):
   a. Anonimiza → llama al motor de IA (1 llamada, timeout 10s)
      · si IA ok → JSON con categoría, facultades, urgencia, resumen, confianza
      · si IA falla → fallback a reglas (catálogo de facultades)
   b. Genera código PUNKU-2026-NNN
   c. Guarda Expediente en Supabase (datos no sensibles)
   d. Guarda Contacto aparte (datos sensibles)
   e. Crea primer registro en estados_historial = "Recibido"
5. Frontend muestra la Tarjeta de Reconocimiento con código + área
6. Genaro consulta luego con su código → /api/estado?codigo=...
   → devuelve solo campos no sensibles + timeline
7. (Interno) El coordinador entra al CRM → ve la bandeja →
   cambia estado → se registra en historial → Genaro lo ve al consultar
```

## 5. Topología de despliegue

- **Vercel** (free tier): hospeda la app Next.js (frontend + API routes). Deploy directo desde GitHub.
- **Supabase** (free tier): base de datos PostgreSQL gestionada + RLS.
- **API de IA**: servicio externo llamado solo desde las API routes (key en variable de entorno de Vercel).
- Sin servidores propios que administrar en el MVP. Todo gestionado y gratuito.

## 6. Comunicación entre componentes

| De → A | Cómo | Seguridad |
|---|---|---|
| Frontend → Backend | fetch a API routes (mismo dominio) | sin llaves en cliente |
| Backend → Supabase | SDK de Supabase | service role solo en server |
| Backend → IA | HTTPS a la API | key en variable de entorno |
| Frontend → Supabase (lecturas públicas) | anon key | protegida por RLS |

## 7. Decisiones justificadas

- **Next.js (no front + back separados):** un solo proyecto, las API routes dan backend sin montar servidor aparte. Menos piezas = menos tiempo = menos bugs.
- **Supabase (no BD propia):** PostgreSQL gestionado, gratis, con RLS y auth listos. Cero administración.
- **Vercel:** deploy en minutos desde GitHub, gratis, ideal para demo.
- **IA tras interfaz:** cumple soberanía de datos futura sin reescribir (spec 03).

## 8. Preparado para escalar (sin reescribir)

- Cambiar el modelo de IA: solo la implementación de la interfaz del motor.
- Mover a infraestructura propia (OTIC-UNCP/Huawei): Next.js y PostgreSQL son portables; se puede salir de Vercel/Supabase gestionado a self-hosted sin cambiar la lógica.
- Agregar canales (WhatsApp, etc.): nuevos puntos de entrada que llaman a la misma API de creación de expedientes.

## 9. Variables abiertas

> **RANGO DE MANIOBRA — Hosting de producción:** MVP en Vercel + Supabase gestionado. Producción podría migrar a infraestructura de la UNCP (OTIC) por soberanía. La portabilidad ya está prevista. Se confirma en piloto.

## 10. Criterios de aceptación

- [ ] Una sola app Next.js sirve ambas caras.
- [ ] Ninguna llave está en el frontend.
- [ ] El motor de IA está aislado tras una interfaz.
- [ ] El flujo end-to-end funciona: ingreso → IA/fallback → expediente → código → consulta → CRM → estado reflejado.
- [ ] Desplegable en Vercel + Supabase con free tier.
