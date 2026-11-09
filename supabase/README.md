# Base de datos (Supabase)

Proyecto Supabase: `zdvcvazybuupalvjacnh`. Las migraciones se aplican **en orden**.

| Archivo | Qué contiene |
|---|---|
| `migrations/0001_schema.sql` | Las 9 tablas (empresas, miembros, configuración, vacantes, candidatos, mensajes, evaluaciones, preguntas de ayuda, acciones hechas), llaves foráneas e índices. |
| `migrations/0002_rls.sql` | Seguridad por filas (RLS): cada persona solo ve las empresas donde su correo está en `tenant_members`. Funciones `my_tenant_ids()` y `ping()`. Quita todo acceso de tablas al rol `anon`. |
| `migrations/0003_fk_tenant_y_anon.sql` | Corrección: las llaves foráneas pasan a ser compuestas `(id, tenant_id)` para que nadie de una empresa pueda apuntar a filas de otra; y se le quitan a `anon` los privilegios por defecto (solo conserva `ping()`). |
| `migrations/0004_seed_functions.sql` | Datos de ejemplo y funciones `seed_tenant` / `reset_demo`. **No se escribe a mano: se genera** con `npm run gen:seed-sql` (Tarea 3). |
| `migrations/0005_evaluations_source.sql` | Columna `source` ('ai' / 'human') en evaluaciones y `done_at` con valor por defecto `now()` y obligatorio en acciones de Talento. |

## Cómo volver a aplicarlas

- Con Claude: herramienta de Supabase `apply_migration`, una vez por archivo, con el contenido exacto del archivo (nombres `schema`, `rls`, ...).
- O en el panel de Supabase: SQL Editor, pegar el contenido de cada archivo y ejecutar, en orden 0001 a 0005.

Las tablas usan `create table if not exists` y las políticas y funciones `drop policy if exists` / `create or replace`, así que repetir 0001 y 0002 es seguro. 0003 se aplica una sola vez, después de 0001 y 0002.

## Mantenimiento

**Tarea diaria contra la pausa.** El plan gratis de Supabase pausa el proyecto si pasan 7 días sin consultas. Por eso GitHub ejecuta cada día la tarea "Mantener despierto Supabase" (`.github/workflows/keep-supabase-awake.yml`), que llama a `ping()`. Para lanzarla a mano: en GitHub, pestaña Actions → "Mantener despierto Supabase" → Run workflow.

**Si el proyecto aparece pausado.** Entra al panel de Supabase y pulsa "Resume project". Pasados 90 días de pausa ya no se puede reanudar: hay que restaurarlo desde un respaldo, o crear el proyecto de nuevo y volver a aplicar las migraciones en orden, de la 0001 a la 0005.

**Cómo crear usuarios.** Panel de Supabase → Authentication → Users → Add user → Create new user → escribir correo y contraseña → marcar "Auto Confirm User".

**Registro público.** Para que nadie pueda crearse una cuenta por su cuenta: Authentication → Sign In / Providers → Email → desactivar "Allow new users to sign up". En la misma pantalla, activar "Secure email change".

**Variables del repositorio.** En GitHub: Settings → Secrets and variables → Actions → pestaña Variables. Deben existir `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (las usan el despliegue de Pages y el ping diario). En tu computador van en `.env.local` (mira `.env.example`).
