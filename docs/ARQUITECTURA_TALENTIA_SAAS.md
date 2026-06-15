# TALENTIA SaaS — Documento de Arquitectura y Plan de Ejecución

> **Equipo:** Arquitecto SaaS · Ingeniero de IA · Full-Stack Senior · PM Técnico
> **Producto:** Plataforma B2B multi-tenant de automatización de reclutamiento con IA.
> **Tesis del producto:** *una sola persona gestiona cientos de candidatos* — la IA hace el screening y la entrevista inicial.
> **Fecha:** 2026-06 · **Estado:** borrador v1 (pendiente confirmar 3 decisiones de dirección).

---

## 0. Diagnóstico estratégico (leer primero)

Hoy existen **dos productos distintos** bajo el nombre TALENTIA:

| | TALENTIA Americana 2000 (actual) | TALENTIA SaaS (la visión) |
|---|---|---|
| Tipo | HRIS interno de talento | ATS + IA de reclutamiento |
| Tenancy | 1 empresa (single-tenant) | Multi-tenant B2B |
| Backend | Firebase cliente, sin servidor | Backend real + colas + webhooks |
| Comprador | RRHH interno de Americana | Cualquier reclutador / agencia |
| Núcleo | Desempeño, cultura, 9-box | Screening + entrevistas IA |

**Recomendación del equipo:** construir TALENTIA SaaS como **producto nuevo** en un **monorepo**, **reutilizando los componentes React y el design system** del app actual. El HRIS interno queda como está (o se integra después como módulo "Gestión de Talento"). No mezclar los dos motores desde el día 1.

---

## 1. Stack Tecnológico Recomendado

Principio rector: **Oscar no es técnico y la IA escribe todo el código.** Por eso priorizamos servicios *gestionados* que colapsan complejidad, un solo lenguaje (TypeScript de punta a punta) y plataformas que evitan reinventar telefonía/colas/billing.

### Frontend
- **React 19 + TypeScript + Vite + Tailwind 4** — ya lo tienes y funciona. Se conserva.
- **shadcn/ui (Radix)** para componentes accesibles · **TanStack Query** (estado del servidor) · **react-hook-form + Zod** (formularios y validación) · **Zustand** (estado UI ligero). React Router 7 ya está.

### Backend
- **Supabase** como columna vertebral de datos: **PostgreSQL + Auth + Storage + Realtime + Row-Level Security (RLS)**. Gestionado, sin DevOps. RLS es *la* pieza que da multi-tenancy seguro casi gratis.
- **NestJS (Node + TypeScript)** como servicio de API/orquestación: maneja lo que no encaja en serverless — pipelines de IA largos, webhooks de Twilio/telefonía, billing, lógica de créditos. NestJS da estructura modular consistente (ideal cuando una IA escribe el código).
- Desplegado en **Railway o Render** (deploy de un clic, escala simple).

### Base de Datos
- **PostgreSQL** (Supabase). Multi-tenancy por **`tenant_id` + RLS** (esquema compartido, aislamiento por política). Patrón estándar y escalable de SaaS B2B.
- **pgvector** para embeddings de CVs (match semántico).
- **Redis (Upstash)** para colas, caché y rate-limiting de créditos.

### Orquestación de trabajos (IA)
- **Inngest** o **Trigger.dev** — workflows durables paso-a-paso con reintentos. Clave para pipelines de IA multi-etapa sin construir infra de colas a mano.

### IA y APIs de terceros
| Necesidad | Recomendación | Notas |
|---|---|---|
| LLM razonamiento (scoring, agente entrevista) | **Claude (Anthropic) — Opus/Sonnet** | Structured output + tool use; calidad crítica |
| LLM volumen barato (parseo de CV) | **Gemini Flash** | Tier económico para alto volumen (ya lo usas) |
| Parseo/OCR de CV | **LlamaParse / unstructured.io** + **Google Document AI** (PDFs escaneados) | Fallback OCR → cola de errores |
| Embeddings | **Voyage AI** o OpenAI → pgvector | Match semántico |
| WhatsApp | **Twilio WhatsApp** (rápido) o **Meta Cloud API** (barato a escala) | Mensajería + agendamiento |
| Entrevista por voz/teléfono | **Vapi** o **Retell AI** | Agente de voz end-to-end (STT+LLM+TTS); evita construir telefonía |
| Entrevista por Meet/video | **Recall.ai** | Bot que entra al Meet, graba y transcribe |
| Transcripción | **Deepgram** o **AssemblyAI** | Diarización; Whisper como fallback |
| Voz del entrevistador IA | **ElevenLabs** | (Vapi/Retell ya lo incluyen) |
| Billing / créditos | **Stripe Billing** (suscripción + uso medido) | Planes y créditos |
| Email transaccional | **Resend** | Notificaciones |
| Observabilidad IA / costos | **Langfuse** o **Helicone** | Trazas + costo por llamada (alimenta métricas) |
| Errores app | **Sentry** | |

---

## 2. Arquitectura de Base de Datos (Core multi-tenant)

Toda tabla con datos de cliente lleva `tenant_id uuid not null references tenants(id)`. Política RLS: `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`.

### Entidades

- **tenants** — `id, name, slug, status, created_at`. La organización cliente.
- **plans** — `id, name, monthly_price, limits jsonb` (`max_jobs, max_candidates, interview_minutes, screening_credits, seats`).
- **subscriptions** — `tenant_id, plan_id, stripe_subscription_id, status, current_period_end`.
- **usage_events** — `tenant_id, type (screening|interview_min|whatsapp_msg|llm_tokens), amount, cost_usd, ref_id, created_at`. Motor de **créditos + métricas de costo**.
- **users** — `id, tenant_id, email, role (owner|recruiter|admin|super_admin), auth_uid`.
- **jobs** (vacantes) — `tenant_id, title, description, salary_min, salary_max, status, apply_slug, created_by`.
- **interview_questions** — `job_id, text, type, source (manual|ai), weight, ideal_answer`.
- **screening_filters** — `job_id, polarity (positive|negative), criterion, weight`.
- **candidates** — `tenant_id, job_id, name, email, phone, source, stage, cv_url, parsed jsonb, embedding vector, screening_score, screening_status, flags jsonb`.
- **interviews** — `candidate_id, channel (phone|whatsapp|meet), status, scheduled_at, recording_url, transcript, score, discrepancies jsonb, agent_session_id`.
- **interview_turns** — `interview_id, role (agent|candidate), content, ts`. Historial conversacional (contexto).
- **messages** — `candidate_id, channel, direction (in|out), body, status`. Log de comunicaciones.
- **audit_log** — `tenant_id, actor, action, entity, diff jsonb, ts`.

### Relaciones
```
tenant 1─* users · jobs · candidates · subscriptions · usage_events
job    1─* candidates · interview_questions · screening_filters
candidate 1─* interviews · messages
interview 1─* interview_turns
plan   1─* subscriptions
```

### Límites de plan (enforcement)
- Guard en la API verifica `usage actual vs plans.limits` **antes** de cada mutación costosa (crear job, correr screening, iniciar entrevista).
- Cada operación con costo escribe un `usage_events`. Un saldo de créditos = `límite_plan − suma(usage_events del período)`.

---

## 3. Flujo de Integración de IA

### 3.1 Pipeline de Screening de CVs
```
Carga → Parseo → Extracción estructurada → Embedding → Scoring/Match → Filtros → Ranking
```
1. **Ingesta:** CV a Storage → dispara workflow (Inngest).
2. **Parseo:** detecta texto vs escaneado. Texto → LlamaParse. Escaneado/ilegible → Document AI (OCR). Si sigue ilegible → `parse_error` y va a la **cola de errores** para gestión manual (nunca falla en silencio).
3. **Extracción estructurada:** LLM con **JSON Schema / tool use** extrae `nombre, contacto, experiencia[], skills[], educación, años`. Salida validada por esquema → no hay campos inventados.
4. **Embedding:** vector del CV + descripción del job → pgvector. Match semántico = similitud coseno.
5. **Scoring:** puntaje híbrido = `peso(match_semántico) + reglas(filtros +/−) + rúbrica_LLM`. El LLM puntúa contra los must-have del job y **devuelve puntaje + justificación + cita textual del CV** (grounding).
6. **Filtros:** positivos (boost) y negativos (rechazo duro, ej. "sin licencia" → descartado).
7. **Salida:** candidatos rankeados con score, justificación y evidencia citada.

**Anti-alucinación:** salida estructurada · *temperatura baja* · separar **extracción** de **juicio** · exigir cita textual del CV o `null` · capa de validación que rechaza afirmaciones no ancladas en el texto fuente · humano-en-el-loop en puntajes borderline.

### 3.2 Agente de Entrevistas
- **Contexto:** estado de sesión en DB (`interviews` + `interview_turns`). El system prompt incluye: descripción del job, el banco de `interview_questions` con pesos y respuestas ideales, el CV parseado (para detectar discrepancias) y la rúbrica. Historial turno-a-turno; se *resume* lo antiguo si crece (compactación de contexto).
- **Canales (adaptadores):**
  - *Teléfono* → Vapi/Retell (STT/LLM/TTS en tiempo real). El "cerebro" = nuestro agente.
  - *WhatsApp* → webhook Twilio/Meta → agente genera el siguiente mensaje; asíncrono, con estado en DB.
  - *Meet/video* → bot de Recall.ai entra, graba y transcribe → scoring posterior.
- **Restricción de guion:** el agente **solo** pregunta del banco aprobado (tool-constrained) — no improvisa preguntas ilegales ni se sale de tema.
- **Scoring post-entrevista:** por cada pregunta, el LLM compara respuesta vs respuesta ideal + rúbrica → puntaje por pregunta + global, con cita del transcript.
- **Detección de discrepancias CV vs respuestas:** pase dedicado que cruza afirmaciones del transcript contra el CV parseado (ej. dijo "3 años React", CV dice 1) → lista de discrepancias con evidencia.
- **Costo/métricas:** cada llamada (LLM/STT/TTS/WhatsApp) escribe un `usage_events` con tokens/minutos/costo → alimenta el dashboard de métricas y descuenta créditos.

---

## 4. Roadmap en 4 Fases (priorizado por valor y dependencia)

> El MVP es la **cuña**: lo mínimo que prueba "una persona hace screening de cientos". Esa cuña es el **Screening Engine**, no las entrevistas de voz (eso viene después).

### FASE 1 — MVP: "Motor de Screening" (la cuña)
- Fundación multi-tenant: `tenants`, `users`, Auth, RLS, esqueleto de `plans`/límites.
- **Wizard de Vacantes (básico):** crear job, descripción generada con IA, link de postulación, preguntas (manual + IA). *(Scraping de salarios y export XML → fase posterior.)*
- **Screening de CVs (núcleo):** carga masiva, parseo + OCR + cola de errores, extracción estructurada, scoring/match con filtros +/−, lista rankeada con justificación. ← **demo estrella.**
- Pipeline de candidatos (kanban) — reutiliza `RecruitmentView` actual.
- Dashboard básico + medición de costos/créditos (`usage_events`).
- Esqueleto de billing (planes, Stripe checkout, límites aplicados).

### FASE 2 — "Entrevistas IA asíncronas (texto)"
- WhatsApp (Twilio/Meta): mensaje automático para agendar + agente de entrevista por texto.
- Núcleo del agente (contexto, banco de preguntas, scoring, discrepancias) — *texto primero*.
- Almacenamiento de grabación/transcript, scoring por pregunta.
- Agendamiento de candidatos.
- Wizard avanzado: scraping de salarios, roles similares, **export XML para LinkedIn**.

### FASE 3 — "Voz + Video + Monitoreo en tiempo real"
- Entrevistas por teléfono (Vapi/Retell).
- Meet/video vía Recall.ai (entra, graba, transcribe, puntúa).
- Panel de monitoreo en vivo (videollamadas + panel WhatsApp) con Supabase Realtime.
- Dashboard de métricas completo (costo de contratación, time-to-fill, funnel).

### FASE 4 — "Plataforma y Escala"
- Consola super-admin multi-tenant (gestión de tenants, planes, créditos, tutoriales integrados).
- Onboarding/tutoriales in-app.
- Tuning de anti-alucinación + observabilidad IA (Langfuse).
- **Futuro:** avatares de video (HeyGen/D-ID), onboarding automático, contratos legales automáticos (DocuSign + LLM).
- Hardening: colas, rate limits, residencia de datos, preparación SOC2.

---

## 5. Primer Paso Práctico — Estructura inicial y backend multi-tenant

### Estructura de carpetas (monorepo con pnpm + Turborepo)
```
talentia/
├─ apps/
│  ├─ web/                 # App React (recruiter UI) — migra el src/ actual aquí
│  └─ api/                 # NestJS — orquestación IA, webhooks, billing
│     └─ src/
│        ├─ main.ts
│        ├─ app.module.ts
│        ├─ common/
│        │  ├─ guards/tenant.guard.ts        # extrae tenant_id del JWT
│        │  ├─ interceptors/tenant.interceptor.ts
│        │  └─ decorators/tenant.decorator.ts
│        ├─ modules/
│        │  ├─ tenants/
│        │  ├─ jobs/
│        │  ├─ candidates/
│        │  ├─ screening/   # pipeline de CVs
│        │  ├─ interviews/  # agente
│        │  └─ billing/
│        └─ supabase/supabase.service.ts
├─ packages/
│  ├─ db/                  # migraciones SQL + políticas RLS + tipos generados
│  ├─ shared/              # tipos + esquemas Zod compartidos
│  └─ ui/                  # design system extraído de los componentes actuales
├─ infra/
├─ turbo.json
└─ package.json
```

### Núcleo multi-tenant (lo que se programa primero)
1. **Migración SQL** con `tenants`, `users`, y **políticas RLS** que filtran por `tenant_id` del JWT.
2. **TenantGuard** (NestJS): lee `tenant_id` del JWT de Supabase, lo valida y lo inyecta en el request.
3. **SupabaseService**: cliente por-request que respeta RLS (usa el token del usuario, no la service key, en operaciones de tenant).
4. Endpoint de ejemplo `GET /jobs` que **solo** devuelve los jobs del tenant del usuario — prueba de que el aislamiento funciona.

*(El código concreto se genera al confirmar las 3 decisiones de dirección — ver abajo.)*

---

## Decisiones de dirección pendientes (bloquean el scaffolding de código)
1. **Codebase:** ¿producto nuevo (monorepo) reutilizando componentes, o evolucionar el app actual?
2. **MVP / cuña:** ¿arrancamos por Screening de CVs (recomendado), Entrevistas IA, o Wizard de Vacantes?
3. **Presupuesto de herramientas/mes** durante la validación (define proveedores: Twilio vs Meta, Vapi vs construir, etc.).

## Continuidad móvil
Este documento vive en `docs/` del repo. Al hacer push a GitHub, queda accesible desde **claude.ai/code** en el móvil — cerrar la laptop no pierde contexto: el plan y el avance están en el repo, no en la sesión.
