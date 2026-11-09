# Entrega A — Base de datos compartida (Supabase) + inicio de sesión

**Fecha:** 2026-11-09 · **Estado:** implementada en la rama `supabase-persistencia` (2026-11-09); PR pendiente · **Rama:** `supabase-persistencia`

## 1. Problema

Hoy TALENTIA 2.0 no tiene base de datos. Todo lo que el equipo de RR.HH. ingresa (vacantes, CVs cargados, mensajes enviados, evaluaciones de entrevista, metas, equipo, módulos, acciones de Talento) se guarda únicamente en el `localStorage` del navegador donde lo escribió. Consecuencias reportadas por el equipo como "se nos borra todo":

- Cada persona ve solo lo que ella misma ingresó; nadie ve lo de los demás.
- Otro dispositivo, otro navegador o una ventana privada arrancan vacíos.
- El navegador puede limpiar esos datos solo (historial, espacio).
- "Restablecer la demo" borra todo lo de ese navegador.
- Dashboard y Métricas solo leen los candidatos de ejemplo, no lo que el equipo carga.
- En Talento, marcar una acción como completada vive en memoria y se pierde al recargar.

## 2. Objetivo y criterios de éxito

**Objetivo:** que lo que ingrese cualquier miembro del equipo de Americana 2000 quede guardado en una base de datos compartida en la nube y lo vean todos, desde cualquier dispositivo, con acceso controlado por inicio de sesión.

Éxito cuando:

1. Jessica carga un CV en su laptop y Reynaldo lo ve en su celular al recargar.
2. Nada de lo que el equipo ingresa depende del navegador (salvo preferencias de interfaz: bienvenida vista, recorridos vistos, empresa seleccionada).
3. Solo entran personas con cuenta (correo + contraseña); cada una ve únicamente los datos de su empresa.
4. "Restablecer la demo" devuelve a **toda la empresa** al juego de datos de ejemplo, y solo lo puede hacer un jefe (owner/admin) u Oscar.
5. Dashboard y Métricas calculan con los candidatos reales, no solo con los de ejemplo.
6. La demo pública sigue publicándose sola en GitHub Pages con cada merge a `main`.

## 3. Decisiones tomadas (con Oscar, 2026-11-09)

| Decisión | Elección | Por qué |
|---|---|---|
| Espacio en Supabase (plan gratis: 2 proyectos activos) | **Pausar "Abiq"** y reactivar "TalentIA 2.0" (`zdvcvazybuupalvjacnh`). Si la ventana de 90 días para reactivar ya venció, crear un proyecto gratis nuevo con el mismo nombre. | Elección de Oscar entre pausar KWOKI Taller, pausar Abiq o pagar Pro. |
| Alcance global | Base de datos **+** IA real, **divididos en dos entregas**: A (esta) y B (IA real para CVs). | Un solo paquete sería lento; A alivia al equipo de inmediato. B necesita cuenta de Anthropic con saldo. |
| Acceso | **Correo y contraseña.** Registro público apagado. Oscar crea las cuentas en el panel de Supabase. | La demo es pública en internet; sin login cualquiera podría borrar los datos. |
| Arquitectura | **La app habla directo con Supabase** (supabase-js) y la seguridad vive en la base de datos (RLS). Sin servidor propio. Sin modo local paralelo. | Más simple; un solo juego de datos de ejemplo; el servidor propio (NestJS) queda para la Fase 3. |
| Identificadores | Se conservan los `id` de texto actuales (`job_motos`, `cand_01`, `u_reynaldo`, `newId('cand')`). | No cambia el modelo TypeScript ni las páginas. |
| Datos de ejemplo | Pasan a la base de datos, con **fechas relativas a hoy**. `DEMO_NOW` desaparece: las métricas usan la fecha real. | Con datos reales el "hoy" fijo del 2026-06-20 dejaría todo vencido. |
| Transcripciones de Entrevistas IA | **No se guardan** en A. | El módulo es simulado y la app no tiene pantalla para releerlas; guardarlas sin poder verlas no aporta. |
| Catálogos fijos | Planes, módulos opcionales, guía de entrevista, 9-Box y Cultura 360° de ejemplo **siguen en código**. | Software opinado: la importación de colaboradores por plantilla es trabajo futuro, junto con la Fase 2 completa. |
| Consola Admin (`/admin`) | Sigue leyendo el seed en código (oculta en `TEAM_PILOT`). | No es para RR.HH.; se moderniza en B junto con el registro real de consumo. |

## 4. Lo que NO incluye esta entrega

- IA real: lectura de CVs y puntajes siguen simulados (`DEMO_MODE`). La pantalla de Screening lo dice de forma visible.
- WhatsApp y correo reales: siguen simulados, incluida la respuesta del candidato.
- Recuperación de contraseña por correo: Oscar la restablece desde el panel de Supabase.
- Importar lo que el equipo tenía en sus navegadores: no se migra; arrancan con el juego de datos de ejemplo (eran datos de prueba).
- Edición de personas del 9-Box, importación por plantillas, consumo real (usage), facturación.
- Tiempo real (ver cambios de otros sin recargar). Los datos se recargan al entrar a cada pantalla, al volver a la pestaña y al recargar.

## 5. Arquitectura

```
Navegador (React SPA en GitHub Pages)
  ├─ AuthProvider ── supabase.auth (correo + contraseña, sesión recordada)
  ├─ TenantProvider ── empresas a las que pertenece el usuario (tenant_members)
  ├─ SettingsProvider, JobsProvider, CandidatesProvider,
  │  OutreachProvider, EvaluationsProvider, TalentActionsProvider, HelpProvider
  │     └─ cada uno carga su tabla al elegir empresa y escribe en cada acción
  └─ src/core/db/*.ts  (repositorios: una función por operación, mapeo fila ↔ tipo TS)
          │ supabase-js (clave publicable, pública por diseño)
          ▼
Supabase "TalentIA 2.0" (Postgres + Auth)
  ├─ Tablas public.* con RLS por empresa (tenant_id ∈ empresas del usuario)
  ├─ Funciones: my_tenant_ids(), seed_tenant(), reset_demo(), ping()
  └─ Auth: usuarios creados por Oscar; registro público apagado
```

Principios:

- **Las páginas no cambian de API.** Los hooks `useJobs`, `useCandidates`, `useSettings`, `useOutreach`, `useEvaluations`, `useHelp` conservan su firma. Lo que cambia es dónde guardan.
- **Repositorios delgados.** `src/core/db/<tabla>.ts` expone funciones puras de mapeo (`rowToJob`, `jobToRow`, etc., probadas con vitest) y funciones de acceso (`listJobs(tenantId)`, `insertJob(job)`, …). Nada de SQL en los contexts.
- **Actualización optimista.** Cada acción cambia el estado local de inmediato, escribe en Supabase y, si falla, revierte y avisa con un mensaje en español.
- **Seguridad en la base de datos, no en la app.** La clave publicable viaja en el bundle (es su propósito); RLS impide leer o escribir filas de otra empresa, y sin sesión no se lee nada.

## 6. Modelo de datos (schema `public`)

Convenciones: `id text primary key`; `tenant_id text not null references tenants(id)`; columnas `snake_case`; estructuras anidadas en `jsonb` con la misma forma que el tipo TypeScript; `inserted_at timestamptz default now()` en tablas de hechos.

| Tabla | Columnas principales | Origen en la app |
|---|---|---|
| `tenants` | `id, name, slug (unique), logo_emoji, industry, brands text[], plan_id, status, created_at date` | `Tenant` (seed `TENANTS`) |
| `tenant_members` | `id, tenant_id, email text null (lower, unique por tenant), name, role check in ('owner','admin','recruiter','super_admin'), title text null` | `User` del seed + personas agregadas en Configuración (`email null`, no inician sesión) |
| `tenant_settings` | `tenant_id pk, modules jsonb, auto_reply jsonb, sla jsonb, updated_at` | `TenantSettings` (sin `team`, que pasa a `tenant_members`) |
| `jobs` | `id, tenant_id, title, brand, department, location, employment_type, status, salary_min int, salary_max int, description, apply_slug, openings int, created_at date, questions jsonb, filters jsonb, interview_guide text null` | `Job` |
| `candidates` | `id, tenant_id, job_id → jobs, owner_id text null → tenant_members, timeline jsonb null, first_name, last_name, email, phone, source, stage, applied_at date, hired_at date null, cv_file_name, screening_status, screening_score int null, match_percent int null, justification text null, evidence jsonb null, flags jsonb null, error_reason text null, parsed jsonb null` | `Candidate` |
| `outreach_messages` | `id, tenant_id, candidate_id → candidates, candidate_name, job_id, channel, "to", body, status, sent_at timestamptz, slot text null, confirmed_slot text null` | `OutreachMessage` |
| `interview_evaluations` | `candidate_id pk → candidates, tenant_id, job_id, role, interviewer_id, date, status, notes jsonb, behavioral jsonb, plural_only jsonb, story_variant, story jsonb, choices jsonb, observations jsonb, updated_at timestamptz` | `InterviewEvaluation` (una por candidato) |
| `help_questions` | `id, tenant_id, member_id text null, route, question, answered bool, asked_at timestamptz` | `HelpQuestion` (hoy en `talentia.help.v1`) |
| `talent_actions_done` | `tenant_id, person_id text, done_by text null, done_at timestamptz`, pk `(tenant_id, person_id)` | `done` en `ActionsPage` (hoy en memoria) |

Borrado en cascada: `jobs → candidates → outreach_messages, interview_evaluations`. Las referencias a `tenant_members` (`candidates.owner_id`, `help_questions.member_id`, `talent_actions_done.done_by`) son `on delete set null`: quitar a una persona del equipo no borra sus candidatos ni sus preguntas.

### Membresías y roles

- Una fila de `tenant_members` por persona **y** empresa. Oscar (`super_admin`) tiene fila en las tres empresas del seed (Americana 2000, Contacta BPO, NovaPay) para la demo multi-empresa al CEO; Reynaldo (`admin`) y Jessica (`recruiter`) solo en Americana 2000.
- El vínculo con Auth es **por correo**: `auth.email()` del token debe coincidir con `tenant_members.email` (comparación en minúsculas). Oscar crea cada cuenta en Supabase con exactamente ese correo. Correos del seed: Oscar `omorales@americana2000.com`, Reynaldo `reynaldo.velasquez@americana2000.com.gt`, Jessica `rrhh@americana2000.com.gt`.
- `hrTeam` (Configuración → Equipo, "Cada quien" en Métricas) = miembros de la empresa con rol distinto de `owner` y `super_admin`. Desde la app solo se pueden quitar miembros sin correo (los agregados ahí mismo).

### Seguridad (RLS)

- RLS activado en todas las tablas. Función `public.my_tenant_ids() returns setof text` (`security definer`, `stable`): empresas donde `lower(email) = lower(auth.email())`.
- Política única por tabla para `select/insert/update/delete`: `tenant_id in (select my_tenant_ids())` (en `tenants`, `id in (…)`). Con `with check` igual en escrituras.
- `tenant_members`: lectura para miembros de la empresa; inserción y borrado solo de filas con `email is null`.
- `help_questions`: inserción y lectura para miembros; borrado solo para `owner/admin/super_admin` (botón "Borrar" oculto para los demás).
- Rol `anon` (sin sesión): ninguna política le aplica → no lee ni escribe nada. Se verifica con una prueba.

### Funciones

- `seed_tenant(p_tenant_id text)`: inserta el juego de datos de ejemplo de esa empresa (vacantes, candidatos, evaluaciones, configuración de fábrica, miembros de fábrica si faltan). Las fechas se expresan como `current_date - N` partiendo de los desfases que hoy tiene el seed respecto a `DEMO_NOW = 2026-06-20`. **Se genera** desde `src/data/seed.ts` y `src/data/seedEvaluations.ts` con `scripts/gen-seed-sql.mjs` (ejecutado con `tsx`), para que el seed en TypeScript siga siendo la fuente de verdad; el SQL generado se guarda en `supabase/migrations/`.
- `reset_demo(p_tenant_id text)`: `security definer`; exige que quien llama sea miembro con rol `owner/admin/super_admin` de esa empresa; borra sus `talent_actions_done`, `outreach_messages`, `interview_evaluations`, `candidates`, `jobs`, `tenant_settings` y miembros sin correo; **conserva `help_questions`** (son el insumo de Oscar); llama a `seed_tenant`.
- `ping() returns int`: `security definer`, concedida a `anon`; devuelve `count(*)` de `tenants`. La usa la tarea diaria para evitar la pausa por inactividad.

Las migraciones viven en el repo (`supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_seed_functions.sql`) y se aplican con la herramienta de Supabase (MCP `apply_migration`) con el mismo nombre; `supabase/README.md` explica cómo volver a aplicarlas.

## 7. Autenticación y sesión

- Supabase Auth, proveedor **email + password**. Registro público (`Allow new users to sign up`) **apagado por Oscar desde el panel** (es un ajuste de Auth que la herramienta de Claude no puede tocar); aun si quedara encendido, quien se registre sin fila en `tenant_members` no ve ningún dato (RLS) y cae en la pantalla "sin empresa asignada". Confirmación por correo no se usa porque Oscar crea los usuarios ya confirmados desde el panel (`Authentication → Users → Add user → Auto confirm`).
- `AuthProvider` (`src/context/AuthContext.tsx`): `session`, `email`, `signIn(email, password)`, `signOut()`, `loading`. La sesión se recuerda en el navegador (comportamiento estándar de supabase-js).
- `LoginPage` (`src/features/auth/LoginPage.tsx`): logo, correo, contraseña, botón "Entrar". Errores en español: credenciales incorrectas, sin conexión, servidor dormido ("El servidor está pausado; avísale a Oscar"). Texto: "¿Olvidaste tu contraseña? Pídele a Oscar que la restablezca."
- Guardia en `App.tsx`: mientras se restaura la sesión, pantalla de carga; sin sesión → `LoginPage`; con sesión pero sin membresías → pantalla "Tu cuenta no está asignada a ninguna empresa; avísale a Oscar" con botón "Cerrar sesión".
- Barra superior: nombre del miembro y botón **Cerrar sesión**. En `TEAM_PILOT` la empresa sigue fija; con `TEAM_PILOT=false` el selector muestra solo las empresas del usuario (Oscar: las tres). La empresa elegida se recuerda en `localStorage` (preferencia de interfaz).

## 8. Cambios en la app, por archivo

| Área | Cambio |
|---|---|
| `src/core/supabase.ts` (nuevo) | `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)`. Si falta una variable, falla al arrancar con mensaje claro (mismo patrón que `providers.ts`). |
| `src/core/db/*.ts` (nuevo) | Repositorios por tabla con mapeos puros y funciones de acceso. |
| `context/AuthContext.tsx` (nuevo) | Sesión y login/logout. |
| `context/TenantContext.tsx` | Empresas desde `tenant_members` + `tenants` del usuario, en vez de `TENANTS`. Expone también `member` (fila del usuario en la empresa actual: id, nombre, rol). |
| `context/SettingsContext.tsx` | Lee/escribe `tenant_settings` (si la empresa aún no tiene fila, valores de fábrica y `upsert` al primer cambio); `hrTeam`, `addTeamMember`, `removeTeamMember` sobre `tenant_members`. Se elimina `localStorage`. |
| `context/JobsContext.tsx` | `jobs` desde `jobs`; `addJob` inserta. Se elimina el seed en código y `localStorage`. |
| `context/CandidatesContext.tsx` | `candidates` desde `candidates`; `addCandidate` inserta con `ownerId = member.id`, `appliedAt = hoy` y `timeline.screened = hoy`; `markInterviewScheduled` y `setStage` actualizan `stage` y la línea de tiempo (`replied` al enviar respuesta, `interviewed`/`offered`/`rejected` al decidir). Desaparece el mapa de etapas sobre el seed. |
| `context/OutreachContext.tsx` | Mensajes desde `outreach_messages`; la simulación de respuesta del candidato se mantiene y persiste los cambios de estado; al cargar, los mensajes que quedaron "en espera" se resuelven como hoy. |
| `context/EvaluationsContext.tsx` | `interview_evaluations`; `saveEvaluation` hace upsert. |
| `context/TalentActionsContext.tsx` (nuevo) | `talent_actions_done`; `ActionsPage` usa el hook en vez de `useState`. |
| `features/help/HelpContext.tsx` | `questions` y `logQuestion` van a `help_questions` (por empresa); `clearQuestions` solo para roles permitidos. `welcomeSeen`, `tourDone`, `moduleToursDone` siguen en `localStorage` (preferencias de este navegador). |
| `features/dashboard/DashboardPage.tsx`, `features/metrics/MetricsPage.tsx` | Leen `useCandidates()`/`useJobs()` en vez de `CANDIDATES`; "hoy" = fecha real; se quita `DEMO_NOW` y los textos "corte al 20 de junio". |
| `features/screening/ScreeningPage.tsx` | `appliedAt` = hoy; aviso visible "En esta etapa de prueba la lectura y el puntaje del CV son simulados". |
| `features/settings/SettingsPage.tsx` | "Restablecer la demo" llama `reset_demo(tenant)` y recarga; visible solo para `owner/admin/super_admin`; texto actualizado ("para toda la empresa"). Bloque de preguntas lee de la base. |
| `components/layout/Topbar.tsx` | Nombre + "Cerrar sesión". |
| `App.tsx` | `AuthProvider` + guardia de sesión + `TalentActionsProvider`. |
| `src/data/seed.ts`, `seedEvaluations.ts` | Se conservan como fuente del generador SQL y para `/admin`; dejan de importarse desde contexts, Dashboard y Métricas. |
| Ayuda (`helpFaq.ts`, `moduleGuides.ts`, `tourSteps.ts`, `PilotGuidePage.tsx`) | Textos que decían "en este navegador" pasan a "para toda la empresa"; respuesta nueva del chat: "¿por qué tengo que iniciar sesión?" y "¿cómo cambio mi contraseña?". `npm run check:help` debe seguir en verde. |

## 9. Configuración, despliegue y mantenimiento

- **Variables:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. En local, `.env.local` (ignorado por git); se agrega `.env.example` con los nombres. En GitHub, **variables del repositorio** (no secretos: la clave publicable es pública) que `deploy-pages.yml` pasa a `npm run build`.
- **Claves:** Claude las obtiene con la herramienta de Supabase y las escribe en `.env.local` y en las variables del repo con `gh`; nunca se pegan en el chat.
- **Mantener despierto:** `.github/workflows/keep-supabase-awake.yml`, cron diario, llama `POST {URL}/rest/v1/rpc/ping` con el encabezado `apikey` (la clave publicable). Supabase gratis pausa proyectos tras 7 días sin consultas.
- **Dependencias nuevas:** `@supabase/supabase-js`; dev: `vitest`, `tsx`.
- **Orden de puesta en marcha (importante):** (1) pausar Abiq y reactivar/crear el proyecto; (2) aplicar migraciones y seed; (3) verificar RLS; (4) desarrollar y probar la app en local contra el proyecto real; (5) **Oscar crea las tres cuentas** (antes del merge; si no, nadie podría entrar); (6) variables del repo + tarea diaria; (7) PR → `main` → Pages; (8) verificación en vivo.

## 10. Manejo de errores

| Situación | Comportamiento |
|---|---|
| Faltan variables de entorno al arrancar | Error claro en consola y pantalla ("Falta configurar Supabase"). |
| Supabase pausado o sin red | Login y cargas muestran "No se pudo conectar con el servidor. Si persiste, avísale a Oscar." con botón "Reintentar". |
| Credenciales incorrectas | "Correo o contraseña incorrectos." |
| Cuenta sin empresa asignada | Pantalla específica + "Cerrar sesión". |
| Falla al guardar una acción | Se revierte el cambio local y se muestra un aviso; la acción puede repetirse. |
| Sesión expirada | supabase-js la renueva sola; si no puede, vuelve al login conservando la ruta. |
| `reset_demo` por usuario sin permiso | La función lanza error; la app no muestra el botón a esos roles. |

## 11. Pruebas y verificación

- **Unitarias (vitest):** mapeos fila ↔ tipo de cada repositorio (ida y vuelta sin pérdida); conversión de fechas del seed a desfases relativos; reglas de `hrTeam` y de quién puede restablecer.
- **Base de datos (SQL vía MCP):** con `set local role authenticated` y `request.jwt.claims` simulados, un miembro de Americana lee sus filas y **cero** de Contacta; `anon` lee cero filas en todas las tablas; `reset_demo` falla para `recruiter` y funciona para `admin`; tras `reset_demo`, conteos iguales al seed.
- **Flujo en local (navegador integrado, `npm run dev`) con una cuenta de prueba** creada por SQL en el propio proyecto y guardada en `.env.local` (se elimina al terminar): login, crear vacante, cargar CVs de ejemplo, enviar respuesta, evaluar entrevista, marcar acción de Talento, pregunta al chat → recargar y abrir en ventana privada con la misma cuenta: todo sigue; Dashboard y Métricas reflejan el candidato nuevo; "Restablecer la demo" vuelve al ejemplo; cerrar sesión regresa al login.
- **Compilación:** `npm run lint` (tsc), `npm run build`, `npm run check:help`.
- **En vivo tras publicar:** la URL carga, muestra el login y responde contra Supabase (credenciales inválidas devuelven el error del servidor, señal de conectividad). El primer inicio de sesión real lo hace Oscar con su cuenta.

## 12. Pasos que solo Oscar puede hacer

1. Crear las tres cuentas en Supabase (`Authentication → Users → Add user`, con "Auto Confirm User"), con los correos exactos de la sección 6, y entregar las contraseñas a Reynaldo y Jessica por un canal seguro. Claude le dará las instrucciones paso a paso en su momento.
2. Apagar el registro público en Supabase (`Authentication → Sign In / Providers → Email → "Allow new users to sign up"` desactivado).
3. Si prefiere iniciar sesión con otro correo distinto de `omorales@americana2000.com`, decirlo para agregar esa membresía.

## 13. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El proyecto pausado ya no se puede reactivar (más de 90 días) | Crear uno nuevo gratis; el esquema y el seed están en migraciones. |
| Pausa por inactividad en plan gratis | Tarea diaria `ping`; además la app muestra el mensaje "servidor pausado". |
| El equipo pierde lo que tenía en sus navegadores | Eran datos de prueba; se avisa y arrancan con el ejemplo. |
| Correo del usuario con mayúsculas o distinto al del seed | Comparación en minúsculas; pantalla "sin empresa asignada" guía a avisar a Oscar. |
| Clave publicable expuesta | Por diseño; RLS verificada con pruebas; sin sesión no se lee nada. |
| Cambios de Supabase en claves (legacy vs. publicable) | Se usa la clave publicable `sb_publishable_…` y el encabezado `apikey`, según la guía vigente. |

## 14. Siguiente entrega (B, fuera de este alcance)

IA real para CVs: bucket privado de Storage para los PDF, Edge Function `screen-cv` con la clave de Anthropic como secreto de Supabase, Claude Opus 5.5 leyendo el PDF (incluidos escaneados) y devolviendo datos estructurados con evidencia citada; registro de consumo real para `/admin`. Costo estimado 3–8 ¢ por CV; Oscar decide el modelo.
