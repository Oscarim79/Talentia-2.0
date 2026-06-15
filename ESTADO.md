# ESTADO — TALENTIA 2.0

> Punto de retoma para continuar en cualquier dispositivo (laptop o móvil).
> Última actualización: 2026-06-15 (fin de sesión).
> Rama de trabajo: `claude/estado-roadmap-next-u64a2u`.

## Decisiones firmes
- Producto **nuevo desde cero** (este repo), separado del HRIS interno "Talentia Americana 2000".
- **Conservar la joya**: módulo Talento (9-Box + Cultura 360° 10 dimensiones) portado como nativo. Diferenciador: ciclo completo candidato → contratado → 9-Box.
- **MVP = Motor de Screening de CVs.**
- **Demo-first, gratis**: arquitectura de puertos y adaptadores; todos los proveedores de pago en mock (`DEMO_MODE = true`). Se presenta al CEO y luego se decide invertir.
- **Stack producción (cuando haya presupuesto):** Supabase (Postgres+Auth+Storage+RLS) + NestJS; Claude + Gemini Flash; Vapi/Retell (voz); Recall.ai (Meet); Twilio/Meta (WhatsApp); Stripe; Inngest.

## Hecho (Fase 1 — fundación) ✅
- Proyecto Vite + React 19 + TS + Tailwind 4 corriendo.
- Multi-tenant (selector de empresa, aislamiento de datos).
- Dashboard, Screening IA, Vacantes, Candidatos, Entrevistas, Talento 9-Box, Admin.
- Arquitectura puertos/adaptadores con mocks.

## Hecho (Fase 2 — roadmap, sesión 2026-06-15) ✅
1. **Screening** — drag & drop real de archivos + barra de progreso por lote.
2. **Wizard de Vacantes** — flujo de 5 pasos con IA (descripción + preguntas + filtros) y export XML LinkedIn. Store de vacantes en vivo (`JobsContext`).
3. **Agente de Entrevistas** — chat interactivo real con `providers.llm.interviewReply` (historial + contexto de CV).
4. **Métricas** — dashboard de costo por contratación y time-to-fill (tipo `Hire` + seed).

## En progreso 🚧 — Persistencia con Supabase (paso 4 del roadmap)
**Hecho hoy:**
- SDK `@supabase/supabase-js` + cliente `src/core/supabase.ts` (con healthcheck).
- `src/core/config.ts`: `SUPABASE` (url + publishable key como default público, override por `.env.local`).
- `.env.example` + tipos de env (`src/vite-env.d.ts`). `.env.local` ya tiene los valores reales (gitignored).
- Schema **borrador** `supabase/migrations/0001_init.sql` (tablas multi-tenant + RLS por empresa + datos demo).
- Tarjeta de estado de persistencia en **Admin**.
- La app **sigue en modo demo**: aún no se cambió de dónde lee los datos.
- Proyecto Supabase: `zdvcvazybuupalvjacnh.supabase.co`.

## Próxima sesión — EMPEZAR AQUÍ
Terminar la persistencia, en este orden (requiere estar frente a pantalla, no manejando):
1. **Aplicar el schema**: pegar `supabase/migrations/0001_init.sql` en Supabase → SQL Editor → Run.
2. **Revisar las políticas RLS** juntos antes de confiar datos reales (decisión de seguridad).
3. **Montar el login** con Supabase Auth (signup/login) y crear el mapeo `app_users` (auth.uid() → tenant).
4. **Swap de datos seed → queries Supabase**, feature por feature. Empezar por **Vacantes** (ya tiene `JobsContext`, es la más fácil de migrar).

> Nota: desde el contenedor de Claude no se puede probar contra Supabase (la red bloquea hosts externos);
> la app real corre en el navegador y sí conecta. Para probar desde el contenedor, agregar
> `zdvcvazybuupalvjacnh.supabase.co` al *network egress allowlist* del entorno.

## Ideas para después (no urgente)
- Detección automática de discrepancias CV vs. entrevista (Fase 3).
- Editar / pausar / cerrar vacantes.
- Conectar adaptadores reales de IA (Claude / LlamaParse) cuando haya presupuesto.

## Cómo continuar en el móvil
1. Abre **claude.ai** en el teléfono.
2. Selecciona este repositorio (TALENTIA 2.0).
3. Pega: *"Lee ESTADO.md y continúa con el siguiente paso del roadmap."*

## Comandos
```bash
npm install && npm run dev   # http://localhost:3000
```
