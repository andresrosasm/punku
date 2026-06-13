# 01 — Ingesta Ciudadana
## La cara de Genaro: cómo una necesidad entra a PUNKU

> Hereda de `00_contexto_proyecto`. Esta spec define la experiencia del ciudadano (cara externa). Es la más crítica del MVP: aquí se decide si PUNKU se siente ciudadano-céntrico o "un formulario disfrazado". Alimenta directamente a Claude Design.

---

## 1. Objetivo

Permitir que un representante comunal (como Genaro) plantee la necesidad de su comunidad **sin viajar, sin jerga y sin formularios**, mediante una experiencia visual y conversacional que por detrás genera un Expediente Territorial estructurado.

## 2. Por qué es importante

Ataca el dolor #1 ("no sé cómo entrar") y siembra la solución del dolor #2 (entrega el código de seguimiento). Es la pantalla que el jurado verá primero y la que define la percepción de fricción cero. Si esta cara falla, todo PUNKU se percibe como burocracia digital.

## 3. Precondiciones

- El usuario tiene un dispositivo con navegador (smartphone, en su mayoría) y acceso puntual a internet.
- NO se requiere login, registro previo, ni cuenta. (Principio: fricción cero.)
- NO se requiere que el usuario sepa qué facultad u oficina necesita.

## 3.1 Principio de diseño para baja alfabetización (regla de oro)

Una pantalla = una pregunta corta = botones con ícono para TOCAR. El texto libre y el audio son SIEMPRE la salida opcional, nunca la entrada principal. Cada opción lleva ícono grande + frase núcleo corta. El audio es el gran nivelador para quien no lee con comodidad. Aplica a todo el flujo ciudadano.

## 3.2 Alineación de categorías con facultades (trazabilidad)

Cada categoría que ve el ciudadano mapea a facultades reales de la UNCP (la IA hace el mapeo; el ciudadano nunca ve nombres de facultades):

| Categoría ciudadana | Facultades que atienden |
|---|---|
| Agricultura y ganadería | Agronomía, Ciencias Agrarias, Zootecnia, Ing. Industrias Alimentarias |
| Salud | Medicina Humana, Enfermería, Trabajo Social |
| Educación | Educación, Ciencias de la Comunicación |
| Medio ambiente y agua | Ciencias Forestales y del Ambiente, Ing. Química, Ing. Minas |
| Cultura y sociedad | Antropología, Sociología, Trabajo Social, Ciencias de la Comunicación |
| Infraestructura y servicios | Ing. Civil, Ing. Eléctrica, Ing. Mecánica, Arquitectura, Economía, Administración |

Las 25 facultades + modalidad polivalente quedan cubiertas. Ninguna opción de ingesta queda sin facultad.

## 4. Flujo principal (camino feliz)

### Pantalla 0 — Bienvenida y elección de modo
- Mensaje cálido en lenguaje llano: *"Cuéntanos qué está pasando en tu comunidad. La UNCP quiere escucharte."*
- **Toggle facilitador** (representa la arquitectura social, sin construirla):
  - "Registro mi propia comunidad"
  - "Ayudo a registrar a otra comunidad" (para municipios, líderes, hijos universitarios, funcionarios)
- Dos accesos visibles: botón grande **PUNKU** (verde, flujo normal) y botón **PUNKU Emergencias** (rojo, distinto, serio).

### Pantalla 1 — Árbol de decisiones visual (flujo normal)
Captura la necesidad con botones-ícono grandes, máximo 3-4 pasos. Cada toque autocompleta campos por detrás sin que el usuario lo note.

- **Paso A — ¿De qué se trata?** (mapea a las 5 áreas de la UNCP)
  - Agricultura y ganadería · Salud · Educación · Medio ambiente y agua · Cultura y sociedad · Infraestructura y servicios
- **Paso B — ¿Qué está pasando?** (4-6 opciones por categoría, fijas, sin sub-ramas profundas para no complicar la construcción. Ej. agricultura: "mis animales se enferman", "mis cultivos rinden poco", "no vendo bien mi producto", "necesito asistencia técnica", "otro")
- **Paso C — ¿Dónde y a quiénes afecta?** (distrito + número aproximado de familias)
- **Paso D — Cuéntanos más (opcional):** campo de texto libre o audio + **foto opcional** ("¿quieres mostrarnos una foto?" — evidencia visual del problema). *Aquí entra la IA.*
- **Paso E — ¿Qué quieres lograr? + ¿Es urgente?** (selección visual por botones con ícono, no texto en frío). Captura el resultado deseado por la comunidad y la urgencia. Es **opcional** (mantiene fricción baja) pero alimenta el "borrador de solicitud" del CRM:
  - "¿Qué quieres lograr?" → botones con ícono según la categoría (ej. agricultura: animales sanos / mejores cosechas / vender mejor). Texto libre o audio como salida secundaria.
  - "¿Es urgente?" → 3 botones: 🔴 Sí urgente · 🟡 Este año · 🟢 Puede esperar.
  - > Estas respuestas, en lenguaje ciudadano, la IA las traduce a objetivo, meta e indicadores en el formato oficial UNCP. La comunidad define el QUÉ y el PARA QUÉ; la universidad pone el CÓMO.

> **Degradación elegante:** si el árbol visual resulta complejo de construir a tiempo, se reduce a 3 preguntas secuenciales simples (área, qué pasa, dónde). La experiencia sobrevive.

> **CONTINGENCIA TÉCNICA — Fusión de pantallas:** si el tiempo aprieta, las 6 pantallas se fusionan a 5 (Bienvenida → Captura completa en una sola vista → Procesando → Tarjeta → Seguimiento). Menos navegación = menos bugs = demo más veloz. El valor no se pierde.

### Pantalla 2 — Datos de contacto (mínimos)
- Nombre del representante + comunidad + distrito + un número de contacto.
- > **Estos datos NO van a la IA.** Se guardan aparte, ligados solo por el código. (Ver spec 03 y 06.)
- Aviso de privacidad simple: *"Tus datos personales se guardan de forma segura y no se comparten."*

### Pantalla 3 — Procesamiento (momento IA visible)
- Microanimación: *"✨ PUNKU está entendiendo tu caso…"*
- Por detrás: UNA llamada a la IA con la necesidad anonimizada → devuelve categoría, urgencia, facultad(es) sugerida(s) y resumen formal. (Ver spec 03.)

### Pantalla 4 — Tarjeta de Reconocimiento Territorial (el alma emocional)
NO dice "solicitud enviada". Dice:

```
Tu comunidad ya fue escuchada.

Código:           PUNKU-2026-001
Área sugerida:    Medio Ambiente y Agua
Estado:           Recibido
Tu necesidad:     [resumen en lenguaje claro]
A quiénes ayuda:  120 familias
Próximo paso:     Clasificación institucional

Guarda tu código para seguir tu caso cuando quieras.
```

> El "Área sugerida" se muestra deliberadamente: deja ver al ciudadano —y al jurado— la magia de la IA en acción (problema → clasificación), comunicando el flujo Necesidad → IA → Expediente de un vistazo.

- Opción de copiar/guardar el código.
- Botón: "Consultar el estado de mi caso".

### Pantalla 5 — Consulta de estado (resuelve el dolor #2)
- El usuario ingresa su código → ve un timeline visual de los estados (Recibido → En revisión → Derivado → Atendido → Cerrado).
- Lenguaje ciudadano en cada estado (ej. "En revisión" = "La universidad está viendo a qué facultad corresponde").

## 5. Flujo PUNKU Emergencias

Mismo destino interno (Solicitud → Clasificación → CRM), solo cambia el tono y `urgencia = alta`:
- Formulario corto y serio (sin árbol lúdico): ¿qué pasó? · ¿dónde? · ¿a quiénes afecta? · contacto · foto opcional.
- Pensado para casos como el de las truchas (contaminación, desastre, emergencia sanitaria), que pueden venir de un gobierno local o regional.
- Genera el mismo Expediente Territorial, marcado como urgente para que el CRM lo priorice.

## 6. Decisiones con rango de maniobra

> **RANGO DE MANIOBRA — Entrada de audio:** ideal para baja alfabetización, pero puede agregar complejidad técnica. Si el tiempo aprieta, el MVP usa solo texto libre + botones; el audio queda como roadmap. Se confirma al construir.

> **RANGO DE MANIOBRA — Niveles del árbol:** 3-4 pasos es el objetivo. Si un área necesita más, se mantiene en 4 máximo para no cansar. Se afina en Claude Design.

## 7. Flujos alternativos (caminos no felices)

- **Usuario no completa el árbol:** se permite saltar al texto libre directo ("solo cuéntanos qué pasa") → la IA clasifica desde el relato.
- **La IA falla o no responde:** fallback a clasificación por reglas (palabras clave del árbol) → el expediente se genera igual con la categoría del árbol. La experiencia NO se cae. (Ver spec 03.)
- **Usuario pierde su código:** en el MVP, puede volver a consultar con nombre + comunidad (búsqueda simple). Recuperación robusta queda a roadmap.
- **Sin conexión a mitad del flujo:** mensaje claro "guarda esto y reintenta"; no se pierde lo avanzado si es posible (mejor esfuerzo en MVP).

## 8. Requisitos de seguridad (heredados de spec 06)

- Sin login = sin credenciales de usuario que proteger en el MVP.
- Datos de contacto se guardan en backend, nunca expuestos en frontend ni enviados a la IA.
- Validación de inputs (longitud, sanitización) antes de procesar.

## 9. Accesibilidad (WCAG 2.2 AA — deseable, aplicada por diseño)

- Botones grandes con ícono + texto (no solo ícono).
- Contraste alto texto/fondo.
- Lenguaje sencillo y directo en cada pantalla.
- Navegable por teclado; HTML semántico para lector de pantalla.
- Texto agrandable sin romper el diseño.

## 10. Criterios de aceptación

- [ ] El usuario llega de "tengo un problema" a "tengo un código" sin escribir jerga ni elegir facultades.
- [ ] El árbol tiene máximo 4 pasos y usa lenguaje ciudadano.
- [ ] Existe el toggle facilitador funcional.
- [ ] Existe PUNKU Emergencias con el mismo flujo interno + urgencia alta.
- [ ] La pantalla final es la Tarjeta de Reconocimiento ("Tu comunidad ya fue escuchada"), no un "enviado" seco.
- [ ] La consulta de estado con código muestra el timeline.
- [ ] Si la IA falla, el flujo se completa igual (fallback).
- [ ] Los datos de contacto nunca se envían a la IA.

## 11. Métricas de éxito (para impacto/piloto)

- Tiempo desde inicio hasta código generado (objetivo: < 3 minutos).
- % de usuarios que completan el flujo sin abandonar.
- % de solicitudes con seguimiento consultado al menos una vez.

## 12. Lo que NO hace

- NO pide login ni cuenta.
- NO muestra al ciudadano las palabras "monovalente/polivalente", "área", ni nombres de oficinas internas.
- NO procesa pagos (el TUPA y la formalización vienen después, en el proceso interno que PUNKU no toca).
- NO envía notificaciones reales en el MVP (simuladas en pantalla; correo/WhatsApp en roadmap).
