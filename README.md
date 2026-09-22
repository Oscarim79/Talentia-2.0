# TALENTIA 2.0

SaaS B2B **multi-tenant** de automatización de reclutamiento con IA.
Tesis: *una sola persona gestiona cientos de candidatos* — la IA hace el screening y la entrevista inicial.

> **Modo demostración (`DEMO_MODE = true`):** la app es 100% funcional **sin conectar ni pagar ningún proveedor**. Toda la "IA" (parseo de CV, scoring, WhatsApp, voz) está simulada con adaptadores mock realistas. Para producción se intercambian los adaptadores por reales (Claude, LlamaParse, Twilio, Vapi, Stripe) sin tocar la UI.

## Cómo correr

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # chequeo de tipos (tsc --noEmit)
npm run build    # build de producción
```

## Qué incluye esta versión (Fase 1 — fundación)

- **Multi-tenant** con selector de empresa (3 tenants demo) — los datos se aíslan por tenant.
- **Dashboard** con funnel, métricas y costo de IA.
- **Screening IA (MVP)** — carga de CVs que ejecuta el pipeline en vivo: parseo → scoring → evidencia anclada al CV, filtros +/−, ranking y **cola de errores** (PDF ilegible).
- **Vacantes** — generación de descripción y preguntas con IA (mock).
- **Candidatos** — pipeline por etapas.
- **Respuestas a CVs** — filtra los CVs puntuados y responde automáticamente (WhatsApp/correo) con una plantilla estándar para agendar la entrevista; regla automática por score y bandeja de envíos.
- **Entrevistas IA** *(módulo opcional, apagado por defecto; se activa en Configuración)* — agente conversacional (transcripción, scoring, detección de discrepancias CV vs. respuestas).
- **Configuración** — catálogo fijo de módulos opcionales por empresa (software opinado: se encienden o apagan, no se configuran).
- **Talento · 9-Box** — la "joya" heredada de Americana 2000: matriz 9-Box (1–5) + Cultura 360° de 10 dimensiones.
- **Admin** — planes, créditos y consumo multi-tenant.

## Arquitectura (puertos y adaptadores)

```
src/
  core/
    config.ts        # DEMO_MODE
    ports.ts         # interfaces: CvParserPort, LlmPort, MessagingPort, VoicePort, BillingPort
    providers.ts     # registro central (aquí se cambian mock <-> real)
    adapters/mock.ts # implementaciones simuladas
  types/             # modelo de dominio (multi-tenant, reclutamiento, talento)
  data/seed.ts       # datos demo
  context/           # TenantContext (multi-tenant)
  components/        # UI + NineBoxMatrix (portada)
  features/          # dashboard, jobs, screening, candidates, outreach, interviews, talent, settings, admin
```

Documento de arquitectura completo: [`docs/ARQUITECTURA_TALENTIA_SAAS.md`](docs/ARQUITECTURA_TALENTIA_SAAS.md).

## Roadmap

- **F1 (esta):** fundación multi-tenant + Motor de Screening (MVP).
- **F2:** Entrevistas IA por texto/WhatsApp + agendamiento + export XML LinkedIn.
- **F3:** Voz + Video + monitoreo en tiempo real + métricas completas.
- **F4:** Consola super-admin, tutoriales, avatares, onboarding y contratos automáticos.


## Demo publicada (GitHub Pages)

Cada push a `main` publica la demo en **https://oscarim79.github.io/Talentia-2.0/** mediante `.github/workflows/deploy-pages.yml` (requiere repo público y Pages con origen "GitHub Actions"). El build de Pages usa `GITHUB_PAGES=true` para servir bajo `/Talentia-2.0/`; en local la base sigue siendo `/`.
