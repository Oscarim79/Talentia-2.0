# ESTADO — TALENTIA 2.0

> Punto de retoma para continuar en cualquier dispositivo (laptop o móvil).
> Última actualización: 2026-06-18.
> Último avance: 9-Box potenciado — filtro por departamento, perfil por persona (10 dimensiones 360°), historial por trimestre (semáforo) con **motor de decisiones de RR.HH.** (racha → reconocimiento/bono/aumento o advertencia/suspensión/desvinculación), recomendación de crecimiento IA basada en los 7 Hábitos (Franklin Covey) y envío por WhatsApp a la persona y a su jefe.
> Objetivo actual: **demo-first** — presentar al CEO con datos mock (más seguro en vivo). Supabase se conecta DESPUÉS del visto bueno.
> Nota de negocio: Americana 2000 es un **retail completo** (cadena multitienda: línea blanca, muebles, motos, tecnología — como Max, La Curacao, El Gallo más Gallo, Agencias Way), NO solo motos. El plan de crecimiento se basa en el libro **Los 7 Hábitos** de Covey.

## Decisiones firmes
- Producto **nuevo desde cero** (este repo), separado del HRIS interno "Talentia Americana 2000".
- **Conservar la joya**: módulo Talento (9-Box + Cultura 360° 10 dimensiones) portado como nativo. Diferenciador: ciclo completo candidato → contratado → 9-Box.
- **MVP = Motor de Screening de CVs.**
- **Demo-first, gratis**: arquitectura de puertos y adaptadores; todos los proveedores de pago en mock (`DEMO_MODE = true`). Se presenta al CEO y luego se decide invertir.
- **Stack producción (cuando haya presupuesto):** Supabase (Postgres+Auth+Storage+RLS) + NestJS; Claude + Gemini Flash; Vapi/Retell (voz); Recall.ai (Meet); Twilio/Meta (WhatsApp); Stripe; Inngest.

## Hecho (Fase 1 — fundación) ✅
- Proyecto Vite + React 19 + TS + Tailwind 4 corriendo.
- Multi-tenant (selector de empresa, aislamiento de datos).
- Dashboard, Screening IA (MVP con pipeline en vivo + cola de errores), Vacantes, Candidatos, Entrevistas (preview), Talento 9-Box, Admin.
- Arquitectura puertos/adaptadores con mocks.
- **Talento 9-Box potenciado** (portado de Talentia 1.0): filtro por departamento, lista de colaboradores clicable, modal de perfil con métricas + 10 dimensiones 360° por persona, **historial por trimestre** (semáforo verde/amarillo/rojo) y **motor de decisiones de RR.HH.** (reglas deterministas en `features/talent/talentDecisions.ts`: la racha de la tendencia → reconocimiento/bono/premio/aumento, o seguimiento/capacitación, o advertencia/suspensión/desvinculación), y **recomendación de crecimiento por IA (7 Hábitos / Covey)** con envío por WhatsApp (`wa.me`) a la persona y a su jefe. Diagnóstico síntoma→hábito en `core/adapters/mock.ts` (mock; el puerto `llm.generateGrowthPlan` queda listo para Gemini real).

## Siguiente (en orden)
1. ✅ **Screening** — drag & drop real de archivos + barra de progreso por lote. *(hecho)*
2. ✅ **Wizard de Vacantes** — flujo paso a paso (5 pasos) para crear vacante con IA + export XML LinkedIn. *(hecho)*
3. ✅ **Agente de Entrevistas** — chat interactivo real usando `providers.llm.interviewReply`: el agente hace las preguntas del banco de la vacante (tool-constrained), con evaluación final (puntaje por pregunta, global y discrepancias CV vs respuestas). *(hecho)*
4. ✅ **Métricas / ROI** — página dedicada (`/metricas`): ahorro vs proceso manual, costo por contratación, time-to-fill, desglose de costo IA, comparación "manual vs TALENTIA". *(hecho)*
5. **Persistencia (Supabase)** — DIFERIDO: se hará DESPUÉS de validar la demo con el CEO (corre con datos mock, más seguro en vivo). Cuenta free de Supabase ya creada por Oscar; pendiente: schema + RLS multi-tenant + auth, por capas.

## Cómo continuar en el móvil
1. Abre **claude.ai** en el teléfono.
2. Selecciona este repositorio (TALENTIA 2.0).
3. Pega: *"Lee ESTADO.md y continúa con el siguiente paso del roadmap."*

## Comandos
```bash
npm install && npm run dev   # http://localhost:3000
```
