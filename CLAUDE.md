# Talentia Labs (antes "TALENTIA 2.0") — producto SaaS nuevo (ACTIVO)

Este repo es el producto SaaS nuevo **"Talentia Labs"** (reclutamiento + gestión de talento con IA, demo-first para presentar al CEO de Americana 2000). Se llamó "TALENTIA 2.0" hasta el 2026-11-10; el repo, la carpeta y la URL de Pages siguen siendo `Talentia-2.0` hasta que Oscar decida renombrarlos. GitHub: `Oscarim79/Talentia-2.0`. Marca: paleta de 4 colores (rojo-naranja `#E94823`, blanco, gris `#D8D8D8`, negro) en `src/index.css`; logo en `src/components/brand/Logo.tsx` y SVG en `public/brand/`.

⚠️ **No confundir con `D:\Proyectos\Talentia-Americana-2000`** — ese es el HRIS interno original ("Talentia 1.0", OKRs/Gemini/Firebase). Los nombres se prestan a confusión: la carpeta llamada "Talentia-2.0" es el producto nuevo; la carpeta con el nombre largo es el viejo. Si Oscar pide algo del HRIS interno, indícale abrir la otra carpeta.

## Al iniciar sesión

- **Lee `ESTADO.md` SIEMPRE**: es el punto de retoma oficial (decisiones firmes, hecho, siguiente). Actualízalo al cerrar la sesión.
- Oscar también trabaja desde el móvil/web: haz `git pull` antes de editar (ya hubo trabajo duplicado por un clon desactualizado).
- `npm test` y `npm run check:help` deben pasar antes de un PR; las migraciones viven en `supabase/migrations/` (ver `supabase/README.md`).

## Claves del producto

- Stack: Vite + React 19 + TS + Tailwind 4. **Datos en Supabase** (proyecto TalentIA 2.0; login con correo y contraseña; `.env.local` con `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`) desde la Entrega A (2026-11). La IA sigue simulada (`DEMO_MODE = true`); la IA real llega en la Entrega B.
- Principio: **software opinado** — la empresa se adapta al software; los datos entran por plantillas estándar, no por configuraciones flexibles.
- Americana 2000 es un **retail completo** (línea blanca, muebles, motos, tecnología), NO solo motos.
- Plan de crecimiento basado en Los 7 Hábitos (Covey).

## Comandos

```bash
npm install
npm run dev
npm run build
```
