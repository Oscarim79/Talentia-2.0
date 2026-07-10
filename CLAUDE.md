# TALENTIA 2.0 — producto SaaS nuevo (ACTIVO)

Este repo es el producto SaaS nuevo **"TALENTIA 2.0"** (reclutamiento + gestión de talento con IA, demo-first para presentar al CEO de Americana 2000). GitHub: `Oscarim79/Talentia-2.0`.

⚠️ **No confundir con `D:\Proyectos\Talentia-Americana-2000`** — ese es el HRIS interno original ("Talentia 1.0", OKRs/Gemini/Firebase). Los nombres se prestan a confusión: la carpeta llamada "Talentia-2.0" es el producto nuevo; la carpeta con el nombre largo es el viejo. Si Oscar pide algo del HRIS interno, indícale abrir la otra carpeta.

## Al iniciar sesión

- **Lee `ESTADO.md` SIEMPRE**: es el punto de retoma oficial (decisiones firmes, hecho, siguiente). Actualízalo al cerrar la sesión.
- Oscar también trabaja desde el móvil/web: haz `git pull` antes de editar (ya hubo trabajo duplicado por un clon desactualizado).

## Claves del producto

- Stack: Vite + React 19 + TS + Tailwind 4. Demo con mocks (`DEMO_MODE = true`); Supabase se conecta DESPUÉS del visto bueno del CEO.
- Principio: **software opinado** — la empresa se adapta al software; los datos entran por plantillas estándar, no por configuraciones flexibles.
- Americana 2000 es un **retail completo** (línea blanca, muebles, motos, tecnología), NO solo motos.
- Plan de crecimiento basado en Los 7 Hábitos (Covey).

## Comandos

```bash
npm install
npm run dev
npm run build
```
