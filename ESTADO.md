# ESTADO — TALENTIA 2.0

> Punto de retoma para continuar en cualquier dispositivo (laptop o móvil).
> Última actualización: 2026-09-22.
> Último avance: **Entrevistas IA pasa a ser MÓDULO OPCIONAL (apagado por defecto) y nace la sección "Respuestas a CVs".** Decisión del CEO: por ahora la app solo debe **filtrar CVs y responder automáticamente a quien los envía para agendar una entrevista**; el agente entrevistador queda disponible para activarlo después. Hecho: catálogo fijo de módulos opcionales en `src/core/modules.ts` + interruptor por empresa en la nueva página **Configuración** (`/configuracion`, persistido en `localStorage`, `src/context/SettingsContext.tsx`); `/entrevistas` protegida por `ModuleGate` (muestra "módulo no activo" + botón a Configuración) y oculta del menú mientras esté apagada. Nueva página **Respuestas a CVs** (`/respuestas`, `src/features/outreach/CvReplyPage.tsx`): filtro por vacante, score mínimo, requisito cumplido, búsqueda y estado; selección múltiple; **plantilla estándar única** (software opinado) con canal WhatsApp/correo, modalidad, 2 opciones de horario, indicaciones y firma; **regla automática** (score ≥ umbral → responder solo) con "Ejecutar ahora"; vista previa por candidato; **bandeja de envíos** (`src/context/OutreachContext.tsx`) con estados Enviando → Enviado → Entrevista agendada / Sin respuesta (respuesta del candidato simulada en demo, determinista) y reenvío a quien no contestó. Puerto `messaging.sendEmail` añadido junto a `sendWhatsApp` (mock). Verificado en vivo con Playwright: menú, bloqueo, envío a 6, confirmaciones, persistencia tras recargar, aislamiento por empresa, móvil sin scroll horizontal. Avance anterior (2026-08-19): **Corregidos los 3 bugs CRÍTICOS de la auditoría** (9-Box alineada, screening blindado contra cambios de empresa a media carga, IDs sin `crypto.randomUUID`) + un 4º bug descubierto al verificar: el reemplazo masivo slate→stone del rediseño corrompió las clases `-translate-*` de la matriz (quedaron `-transtone-*`), corriendo TODOS los puntos 16px a la derecha y abajo. Verificado en vivo: 9/9 personas caen en su celda correcta, lote interrumpido no fuga candidatos, lote normal procesa 4/4. Avance anterior (2026-07-13): **Rediseño visual completo + QA/auditoría integral.** Nueva identidad propia (ya no parece plantilla): paleta verde bosque + marfil + dorado (tokens `brand-*`/`gold-*` en `src/index.css`), tipografías Bricolage Grotesque (títulos/cifras), Instrument Sans (UI) e IBM Plex Mono (etiquetas de sección), sidebar oscura con navegación agrupada (Reclutamiento / Talento / Negocio), **versión móvil funcional** (drawer con hamburguesa; antes se rompía), modales con Escape + `role="dialog"`, el wizard ya no pierde datos con un clic fuera (pide confirmación), empty-state en Métricas para empresas sin datos, y correcciones de color semántico (barras de progreso ya no salen rojas en procesos normales). Reporte QA con evidencia en `.gstack/qa-reports/` (no va a git).
> Objetivo actual: **demo-first** — presentar al CEO con datos mock (más seguro en vivo). Supabase se conecta DESPUÉS del visto bueno.
> Nota de negocio: Americana 2000 es un **retail completo** (cadena multitienda: línea blanca, muebles, motos, tecnología — como Max, La Curacao, El Gallo más Gallo, Agencias Way), NO solo motos. El plan de crecimiento se basa en el libro **Los 7 Hábitos** de Covey.

## Decisiones firmes
- Producto **nuevo desde cero** (este repo), separado del HRIS interno "Talentia Americana 2000".
- **Conservar la joya**: módulo Talento (9-Box + Cultura 360° 10 dimensiones) portado como nativo. Diferenciador: ciclo completo candidato → contratado → 9-Box.
- **MVP = Motor de Screening de CVs.**
- **Demo-first, gratis**: arquitectura de puertos y adaptadores; todos los proveedores de pago en mock (`DEMO_MODE = true`). Se presenta al CEO y luego se decide invertir.
- **Software OPINADO (convención sobre configuración):** la empresa se adapta al software, NO al revés. Nada de onboarding/configuración flexible que se vuelva "un revoltijo de configuraciones" (wizard de config descartado). Los datos entran por **plantillas estándar** que la empresa solo llena y sube — Colaboradores (RR.HH.), KPIs de Desempeño y Cultura 360°. La importación real va junto con la persistencia (Supabase), después del visto bueno del CEO.
- **Módulos opcionales, no configuración (CEO, 2026-09-22):** lo único que la empresa decide en "Configuración" es encender/apagar módulos de un catálogo fijo. **Entrevistas IA es opcional y arranca apagada**; el flujo base de reclutamiento es Screening → **Respuestas a CVs** (filtrar + mensaje automático para agendar entrevista) → Candidatos. El banco de preguntas del wizard de vacantes se conserva (sirve también para entrevistas humanas).
- **Stack producción (cuando haya presupuesto):** Supabase (Postgres+Auth+Storage+RLS) + NestJS; Claude + Gemini Flash; Vapi/Retell (voz); Recall.ai (Meet); Twilio/Meta (WhatsApp); Stripe; Inngest.

## Hecho (Fase 1 — fundación) ✅
- Proyecto Vite + React 19 + TS + Tailwind 4 corriendo.
- Multi-tenant (selector de empresa, aislamiento de datos).
- Dashboard, Screening IA (MVP con pipeline en vivo + cola de errores), Vacantes, Candidatos, Entrevistas (preview), Talento 9-Box, Admin.
- Arquitectura puertos/adaptadores con mocks.
- **Talento 9-Box potenciado** (portado de Talentia 1.0): filtro por departamento, lista de colaboradores clicable, modal de perfil con métricas + 10 dimensiones 360° por persona, **historial por trimestre** (semáforo verde/amarillo/rojo) y **motor de decisiones de RR.HH.** (reglas deterministas en `features/talent/talentDecisions.ts`: la racha de la tendencia → reconocimiento/bono/premio/aumento, o seguimiento/capacitación, o advertencia/suspensión/desvinculación), y **recomendación de crecimiento por IA (7 Hábitos / Covey)** con envío por WhatsApp (`wa.me`) a la persona y a su jefe. Diagnóstico síntoma→hábito en `core/adapters/mock.ts` (mock; el puerto `llm.generateGrowthPlan` queda listo para Gemini real).
- **Tablero de acciones RR.HH.** (`features/talent/ActionsPage.tsx`, ruta `/acciones`): agrega las decisiones de todo el equipo agrupadas por prioridad, con resumen de conteos, filtro por departamento, "Ver perfil" (reusa el modal) y "Marcar hecha" → Completadas.
- **Respuestas a CVs** (`features/outreach/CvReplyPage.tsx`, ruta `/respuestas`): filtro de CVs puntuados + respuesta automática (WhatsApp/correo) con plantilla estándar para proponer 2 horarios de entrevista, regla automática por umbral de score, bandeja de envíos con confirmación del candidato (simulada en demo) y reenvío.
- **Configuración / módulos opcionales** (`features/settings/SettingsPage.tsx`, `core/modules.ts`, `context/SettingsContext.tsx`): interruptor por empresa; Entrevistas IA apagada por defecto y protegida por `components/ModuleGate.tsx`.
- **Reportes a gerentes** (`features/talent/ManagerReportModal.tsx`): por departamento, RR.HH. ve y envía al gerente un reporte del estado de su equipo (resumen + casos por prioridad con su base), vía WhatsApp (`wa.me` al teléfono del jefe), copiar al portapapeles o descargar `.txt`.

## Pendientes ANTES de la demo al CEO (hallazgos de la auditoría 2026-07-13)

Bugs reales encontrados por la auditoría técnica + QA (detalle completo en `.gstack/qa-reports/qa-report-talentia-localhost-2026-07-13.md`):

1. ~~9-Box desalineada~~ **Corregido el 2026-08-19:** el cuadrante ya NO se escribe a mano — se deriva de los scores con la fuente única `src/core/nineBox.ts` (`quadrantFromScores`), usada por el seed y por la cuadrícula de `NineBoxMatrix`. Se ajustaron los scores de 4 personas para que cada quien conserve su historia (una persona por celda). **Bonus:** se descubrió y corrigió que el reemplazo slate→stone del rediseño había corrompido `-translate-x/y-1/2` → `-transtone-*` en la matriz, dibujando todos los puntos corridos 16px. Verificado en vivo: 9/9 en su celda.
2. ~~Fuga entre empresas con lote corriendo~~ **Corregido el 2026-08-19:** `ScreeningPage` lleva un identificador de contexto (`runRef`); al cambiar empresa/vacante el lote en curso queda huérfano y sus resultados se descartan en silencio. Además el selector de vacante se deshabilita durante el proceso. Verificado en vivo: cambiar de empresa a media carga deja la empresa nueva en 0 fugas y el lote normal sigue procesando 4/4.
3. ~~`crypto.randomUUID` truena fuera de localhost~~ **Corregido el 2026-08-19:** generador propio `newId()` en `src/lib/utils.ts` (timestamp + contador, sin crypto). Ya se puede presentar desde tablet/celular por IP.
4. **Los candidatos del screening no existen en el resto de la app (IMPORTANTE):** viven solo en el estado local de la página; Candidatos/Dashboard leen el seed. Evitar el guion "subo CVs → vamos a Candidatos". Arreglo de fondo: falta un puerto de datos (repositorio/contexto) — mismo trabajo que pide Supabase, conviene hacerlo junto.
5. ~~Menores~~ **Corregidos el 2026-07-13 (2ª tanda):** mensaje fantasma en Entrevistas (guard de generación en `agentSpeak`), markdown crudo en la descripción IA (el mock ahora genera texto plano), validación salario min>max en el wizard (aviso + Siguiente bloqueado), IDs del wizard sin colisiones (`nextId`), y `DEMO_MODE` cableado de verdad en `core/providers.ts` (apagarlo sin adaptadores reales falla en el arranque con mensaje claro, no a mitad de demo). El botón muerto "Subir versión legible" sigue pendiente (menor).

## Siguiente (en orden)
1. ✅ **Screening** — drag & drop real de archivos + barra de progreso por lote. *(hecho)*
2. ✅ **Wizard de Vacantes** — flujo paso a paso (5 pasos) para crear vacante con IA + export XML LinkedIn. *(hecho)*
3. ✅ **Agente de Entrevistas** — chat interactivo real usando `providers.llm.interviewReply`: el agente hace las preguntas del banco de la vacante (tool-constrained), con evaluación final (puntaje por pregunta, global y discrepancias CV vs respuestas). *(hecho)*
4. ✅ **Métricas / ROI** — página dedicada (`/metricas`): ahorro vs proceso manual, costo por contratación, time-to-fill, desglose de costo IA, comparación "manual vs TALENTIA". *(hecho)*
5. ✅ **Entrevistas IA como módulo opcional + Respuestas a CVs** *(hecho 2026-09-22; pendiente menor: cuando haya persistencia, la "Entrevista agendada" debe mover al candidato a la etapa `interview` del pipeline y el estado del módulo pasa de `localStorage` a `tenant_settings`).*
6. **Persistencia (Supabase)** — DIFERIDO: se hará DESPUÉS de validar la demo con el CEO (corre con datos mock, más seguro en vivo). Cuenta free de Supabase ya creada por Oscar; pendiente: schema + RLS multi-tenant + auth, por capas.

## Demo en línea
- **URL:** https://oscarim79.github.io/Talentia-2.0/ — se publica sola en cada push a `main` (`.github/workflows/deploy-pages.yml`). Decisión de Oscar (2026-09-22): repo público + GitHub Pages para que el CEO la abra sin instalar nada. La app corre con datos mock; no expone claves.
- `package-lock.json` regenerado en Linux: el anterior venía de Windows y no traía los binarios opcionales de Linux (rollup/lightningcss/oxide), lo que rompía `npm ci` en CI.

## Cómo continuar en el móvil
1. Abre **claude.ai** en el teléfono.
2. Selecciona este repositorio (TALENTIA 2.0).
3. Pega: *"Lee ESTADO.md y continúa con el siguiente paso del roadmap."*

## Comandos
```bash
npm install && npm run dev   # http://localhost:3000
```
