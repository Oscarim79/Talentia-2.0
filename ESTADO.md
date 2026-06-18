# ESTADO — TALENTIA 2.0

> Punto de retoma para continuar en cualquier dispositivo (laptop o móvil).
> Última actualización: 2026-06-18.
> Último avance: Agente de Entrevistas — chat interactivo con el banco de preguntas + evaluación (puntaje por pregunta, global y discrepancias CV vs respuestas).

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

## Siguiente (en orden)
1. ✅ **Screening** — drag & drop real de archivos + barra de progreso por lote. *(hecho)*
2. ✅ **Wizard de Vacantes** — flujo paso a paso (5 pasos) para crear vacante con IA + export XML LinkedIn. *(hecho)*
3. ✅ **Agente de Entrevistas** — chat interactivo real usando `providers.llm.interviewReply`: el agente hace las preguntas del banco de la vacante (tool-constrained), con evaluación final (puntaje por pregunta, global y discrepancias CV vs respuestas). *(hecho)*
4. **Persistencia** — conectar Supabase free (auth + datos reales) cuando se quiera salir de datos demo.
5. **Métricas** — dashboard de costo de contratación y time-to-fill.

## Cómo continuar en el móvil
1. Abre **claude.ai** en el teléfono.
2. Selecciona este repositorio (TALENTIA 2.0).
3. Pega: *"Lee ESTADO.md y continúa con el siguiente paso del roadmap."*

## Comandos
```bash
npm install && npm run dev   # http://localhost:3000
```
