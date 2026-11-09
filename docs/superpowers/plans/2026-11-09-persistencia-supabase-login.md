# Entrega A — Persistencia en Supabase + inicio de sesión · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que todo lo que ingresa el equipo de RR.HH. se guarde en Supabase y lo vean todos, con inicio de sesión por correo y contraseña y datos aislados por empresa.

**Architecture:** La SPA habla directo con Supabase (supabase-js) a través de repositorios delgados en `src/core/db/`; los contexts conservan su API y cambian solo dónde guardan. La seguridad vive en Postgres (RLS por `tenant_id` según la membresía por correo). Los datos de ejemplo se generan como SQL desde `src/data/seed.ts` con fechas relativas a hoy.

**Tech Stack:** Vite 6 + React 19 + TS 5.8 + Tailwind 4; `@supabase/supabase-js@2`; `vitest` (pruebas); `esbuild` (ya instalado, para el generador de SQL); Supabase Postgres 17 + Auth; GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-09-persistencia-supabase-login-design.md`

## Global Constraints

- Proyecto Supabase: "TalentIA 2.0" `zdvcvazybuupalvjacnh` (org "Gripp", plan gratis). Antes de reactivarlo, pausar "Abiq" `xsdebdajaojlnwdivhyu` (decisión de Oscar). Si la reactivación falla por los 90 días, crear uno nuevo gratis llamado `TalentIA 2.0` en la misma org y usar su id en todo lo que sigue.
- Claves y URL **nunca** se escriben en el chat ni en archivos versionados: solo en `.env.local` (ignorado) y en variables del repo de GitHub vía `gh`. Nombres: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (clave `sb_publishable_…`, encabezado `apikey`).
- Identificadores de dominio: `text` (se conservan `t_americana`, `job_motos`, `cand_01`, `u_reynaldo`, `newId('cand')`).
- Columnas en `snake_case`; estructuras anidadas en `jsonb` con la misma forma que el tipo TS. Mapeos ida y vuelta sin pérdida.
- Correos de membresía (minúsculas): Oscar `omorales@americana2000.com`, Reynaldo `reynaldo.velasquez@americana2000.com.gt`, Jessica `rrhh@americana2000.com.gt`.
- Roles: `owner | admin | recruiter | super_admin`. Pueden restablecer la demo y borrar preguntas: `owner`, `admin`, `super_admin`. Equipo de RR.HH. (`hrTeam`, "Cada quien"): todo rol excepto `owner` y `super_admin`.
- Patrón de mutación en contexts: actualizar estado local → llamar repositorio → si falla, revertir y `notifyError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.')`.
- "Hoy" = `todayISO()` (fecha local `YYYY-MM-DD`). `DEMO_NOW` deja de usarse fuera de `seed.ts` y del generador.
- Textos de la app en español sencillo; mensajes exactos de la spec §10.
- Cada tarea termina con `npm run lint` (tsc) en verde y un commit. Mensajes de commit terminan con `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Pruebas unitarias con vitest en `src/**/*.test.ts` y `scripts/*.test.mjs`; se corren con `npm test`.

## Review Focus

1. **Correo con mayúsculas o espacios en el login** (`Rrhh@Americana2000.com.gt `): debe entrar y ver Americana 2000. Prueba en Tarea 3 (`my_tenant_ids` con claim en mayúsculas) y Tarea 6 (`signIn` normaliza con `trim().toLowerCase()`).
2. **Quitar del equipo a una persona que tiene candidatos asignados**: los candidatos siguen, con `ownerId` nulo, y Métricas no revienta. Prueba en Tarea 3 (SQL: `delete` de miembro sin correo → `owner_id` nulo) y Tarea 12 (`recruiterStats` con `ownerId` nulo no lanza).
3. **Dos pestañas abiertas a la vez** (Jessica carga un CV en una, Reynaldo recarga en otra): al volver a la pestaña se recargan los datos. Prueba en Tarea 7 (`useTenantData` recarga en `visibilitychange`).
4. **Supabase pausado o sin red al abrir la app**: pantalla de error con "Reintentar", nunca pantalla en blanco. Prueba en Tarea 7 (`DataReadyGate` con `error`).
5. **Candidato de ejemplo en `screening` cuya evaluación se guarda**: la fila existe por `candidate_id` (pk) y la segunda vez hace upsert sin duplicar. Prueba en Tarea 10 (`upsertEvaluation` dos veces → una fila).

---

### Task 0: Proyecto Supabase activo y variables locales

**Files:**
- Create: `.env.example`
- Create (ignorado por git): `.env.local`

**Interfaces:**
- Produces: `PROJECT_ID` (texto) usado por todas las tareas de base de datos; `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.

- [ ] **Step 1: Pausar Abiq** — MCP `pause_project` con `project_id: xsdebdajaojlnwdivhyu`. Verificar con `get_project`: `status` distinto de `ACTIVE_HEALTHY`.

- [ ] **Step 2: Reactivar TalentIA 2.0** — MCP `restore_project` con `project_id: zdvcvazybuupalvjacnh`. Esperar y consultar `get_project` hasta `status: ACTIVE_HEALTHY` (puede tardar varios minutos; consultar cada 60 s con `Monitor`, no en bucle apretado). Si la herramienta devuelve error por la ventana de 90 días: `get_cost` (type `project`, org `fqffbmprbgkbztjolpqq`) debe decir $0; confirmar el costo con Oscar en una línea y `create_project` con `name: "TalentIA 2.0"`, `region: us-east-1`, `confirm_cost_id` del `confirm_cost`. Anotar el `PROJECT_ID` resultante.

- [ ] **Step 3: Obtener URL y clave publicable** — MCP `get_project_url` y `get_publishable_keys` (usar la clave `sb_publishable_…` con `disabled` falso; si no existe ninguna, usar la `anon` legacy y anotarlo en ESTADO.md).

- [ ] **Step 4: Escribir `.env.local`** (con Bash, sin mostrar los valores en el chat):

```
VITE_SUPABASE_URL=<url>
VITE_SUPABASE_PUBLISHABLE_KEY=<clave>
```

- [ ] **Step 5: Crear `.env.example`** con las dos variables vacías y un comentario: `# Copia a .env.local y pide los valores a Oscar (panel de Supabase → Project Settings → API).`

- [ ] **Step 6: Verificar** — `grep -c "^\.env\.local$\|^\*\.local$\|^\.env$" .gitignore` ≥ 1 y `git status --short` no muestra `.env.local`.

- [ ] **Step 7: Commit**

```bash
git add .env.example
git commit -m "chore(supabase): .env.example con las variables del proyecto"
```

---

### Task 1: Herramientas de prueba y utilidades de fecha

**Files:**
- Modify: `package.json` (deps y scripts)
- Create: `src/lib/dates.ts`, `src/lib/dates.test.ts`, `src/lib/notify.ts`

**Interfaces:**
- Produces: `todayISO(d?: Date): string` (fecha local `YYYY-MM-DD`); `addDaysISO(iso: string, days: number): string`; `notifyError(message: string): void`.

- [ ] **Step 1: Instalar dependencias**

```bash
npm install @supabase/supabase-js@2
npm install -D vitest
```

- [ ] **Step 2: Scripts en `package.json`** — agregar `"test": "vitest run"`. (vitest toma la configuración de `vite.config.ts`; no hace falta archivo aparte.)

- [ ] **Step 3: Prueba que falla** — `src/lib/dates.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { addDaysISO, todayISO } from './dates';

describe('dates', () => {
  it('todayISO usa la fecha local, no UTC', () => {
    expect(todayISO(new Date(2026, 10, 9, 23, 30))).toBe('2026-11-09');
  });
  it('addDaysISO suma y resta días', () => {
    expect(addDaysISO('2026-06-20', -10)).toBe('2026-06-10');
    expect(addDaysISO('2026-12-30', 3)).toBe('2027-01-02');
  });
});
```

- [ ] **Step 4: Correr** — `npm test -- src/lib/dates.test.ts` → FAIL (módulo no existe).

- [ ] **Step 5: Implementar** `src/lib/dates.ts` con las dos funciones (sin librerías) y `src/lib/notify.ts`:

```ts
/** Aviso de error al usuario. Hoy: alert del navegador; un solo lugar para mejorarlo después. */
export function notifyError(message: string): void { window.alert(message); }
```

- [ ] **Step 6: Correr** — `npm test -- src/lib/dates.test.ts` → PASS. `npm run lint` → sin errores.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/dates.ts src/lib/dates.test.ts src/lib/notify.ts
git commit -m "chore: vitest + supabase-js; utilidades de fecha y aviso de error"
```

---

### Task 2: Esquema y seguridad (RLS) en la base de datos

**Files:**
- Create: `supabase/migrations/0001_schema.sql`, `supabase/migrations/0002_rls.sql`, `supabase/README.md`

**Interfaces:**
- Produces: tablas de la spec §6; funciones `public.my_tenant_ids() returns setof text` y `public.ping() returns int`.

- [ ] **Step 1: Escribir `0001_schema.sql`** con las 9 tablas de la spec §6, en este orden: `tenants`, `tenant_members`, `tenant_settings`, `jobs`, `candidates`, `outreach_messages`, `interview_evaluations`, `help_questions`, `talent_actions_done`. Detalles que la spec fija:
  - `tenant_members`: `email text` nullable, índice único `(tenant_id, lower(email))`, `check (role in ('owner','admin','recruiter','super_admin'))`.
  - FKs: `jobs.tenant_id → tenants on delete cascade`; `candidates.job_id → jobs on delete cascade`; `outreach_messages.candidate_id`, `interview_evaluations.candidate_id → candidates on delete cascade`; `candidates.owner_id`, `help_questions.member_id`, `talent_actions_done.done_by → tenant_members(id) on delete set null`.
  - Índices por `tenant_id` en todas las tablas de hechos; `candidates(job_id)`; `outreach_messages(candidate_id)`.
  - `inserted_at timestamptz not null default now()` en `jobs`, `candidates`, `outreach_messages`.
  - `help_questions.id text primary key default gen_random_uuid()::text`; `asked_at timestamptz not null default now()`.

- [ ] **Step 2: Escribir `0002_rls.sql`**:
  - `create or replace function public.my_tenant_ids() returns setof text language sql stable security definer set search_path = public as $$ select tenant_id from public.tenant_members where email is not null and lower(email) = lower(coalesce(auth.email(), '')) $$;` + `revoke all on function public.my_tenant_ids() from public; grant execute … to authenticated;`
  - `alter table … enable row level security` en las 9 tablas (y `force row level security` no: las funciones definer deben seguir viendo todo).
  - Políticas `for all to authenticated using (tenant_id in (select public.my_tenant_ids())) with check (igual)` en 7 tablas; en `tenants`: `using (id in (…))` solo `for select`.
  - `tenant_members`: `select` para miembros de la empresa; `insert` con `with check (tenant_id in (…) and email is null)`; `delete` `using (tenant_id in (…) and email is null)`; sin `update`.
  - `help_questions`: `select`/`insert` para miembros; `delete` `using (tenant_id in (…) and exists (select 1 from tenant_members m where m.tenant_id = help_questions.tenant_id and lower(m.email) = lower(auth.email()) and m.role in ('owner','admin','super_admin')))`.
  - `ping`: `create or replace function public.ping() returns int language sql stable security definer set search_path = public as $$ select count(*)::int from public.tenants $$; grant execute on function public.ping() to anon, authenticated;`
  - Al final: `revoke all on all tables in schema public from anon;` (anon solo puede ejecutar `ping`).

- [ ] **Step 3: Aplicar** — MCP `apply_migration` dos veces (`name: schema`, `name: rls`) con el contenido exacto de cada archivo.

- [ ] **Step 4: Verificar estructura** — MCP `list_tables` (`schemas: ["public"]`, `verbose: true`): 9 tablas, todas con `rls_enabled: true`, FKs según Step 1.

- [ ] **Step 5: Verificar anon** — MCP `execute_sql`:

```sql
set role anon;
select (select count(*) from public.tenants) as tenants, public.ping() as ping;
```
Esperado: error de permiso en `tenants` o, si Supabase conservó privilegios por defecto para `anon`, `tenants = 0` (RLS sin política para anon). Luego por separado: `set role anon; select public.ping();` → `0` (aún sin datos). `reset role;`

- [ ] **Step 6: `supabase/README.md`** — qué contiene cada migración, cómo volver a aplicarlas (herramienta de Supabase de Claude o SQL Editor del panel, en orden), y que `0003` se **genera** con `npm run gen:seed-sql` (Tarea 3).

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat(db): esquema multi-empresa y políticas RLS por membresía"
```

---

### Task 3: Datos de ejemplo generados desde el seed, `seed_tenant` y `reset_demo`

**Files:**
- Create: `scripts/seed-sql-lib.mjs`, `scripts/seed-sql-lib.test.mjs`, `scripts/gen-seed-sql.mjs`
- Create (generado): `supabase/migrations/0003_seed_functions.sql`
- Modify: `src/data/seed.ts` (`USERS`), `package.json` (script `gen:seed-sql`)

**Interfaces:**
- Consumes: `DEMO_NOW`, `TENANTS`, `USERS`, `JOBS`, `CANDIDATES` de `src/data/seed.ts`; `SEED_EVALUATIONS` de `src/data/seedEvaluations.ts`.
- Produces (SQL): `public.seed_tenant(p_tenant_id text) returns void` (security definer), `public.reset_demo(p_tenant_id text) returns void` (security definer, `grant execute to authenticated`).
- Produces (JS, `scripts/seed-sql-lib.mjs`): `daysBefore(iso, anchor)`, `sqlStr(s)`, `relDate(iso, anchor)` → `'(current_date - N)::text'`, `relJsonb(obj, anchor)` → expresión `jsonb_build_object(...)` con fechas relativas, `tenantsSql(tenants)`, `membersSql(users)`, `seedTenantFunctionSql(jobs, candidates, evaluations, anchor)`, `resetDemoFunctionSql()`.

- [ ] **Step 1: `USERS` en `seed.ts`** — Oscar pasa a `role: 'super_admin'` en `t_americana` y se agregan `{ id: 'u_oscar_contacta', tenantId: 't_contacta', …, role: 'super_admin' }` y `{ id: 'u_oscar_novapay', tenantId: 't_novapay', …, role: 'super_admin' }` con el mismo correo y nombre. Confirmar con `grep -rn "USERS" src` que solo `SettingsContext.tsx` lo usa (se reemplaza en Tarea 8).

- [ ] **Step 2: Pruebas que fallan** — `scripts/seed-sql-lib.test.mjs`:

```js
import { describe, expect, it } from 'vitest';
import { daysBefore, relDate, relJsonb, sqlStr } from './seed-sql-lib.mjs';

describe('seed-sql-lib', () => {
  it('daysBefore cuenta días hasta el ancla', () => {
    expect(daysBefore('2026-06-10', '2026-06-20')).toBe(10);
    expect(daysBefore('2026-06-20', '2026-06-20')).toBe(0);
  });
  it('relDate produce SQL relativo a hoy', () => {
    expect(relDate('2026-06-10', '2026-06-20')).toBe('(current_date - 10)::text');
  });
  it('sqlStr escapa comillas simples', () => {
    expect(sqlStr("O'Higgins")).toBe("'O''Higgins'");
  });
  it('relJsonb convierte solo las fechas y conserva null/omisiones', () => {
    expect(relJsonb({ screened: '2026-06-10', replied: undefined }, '2026-06-20'))
      .toBe("jsonb_build_object('screened', (current_date - 10)::text)");
    expect(relJsonb({}, '2026-06-20')).toBe("'{}'::jsonb");
  });
});
```

- [ ] **Step 3: Correr** — `npm test -- scripts/seed-sql-lib.test.mjs` → FAIL.

- [ ] **Step 4: Implementar `scripts/seed-sql-lib.mjs`**. Reglas: toda cadena con forma `YYYY-MM-DD` dentro de `timeline`, `appliedAt`, `hiredAt`, `createdAt` (jobs), `date` (evaluaciones) va como `relDate`; `updatedAt` de evaluaciones como `(now() - interval 'N days')`; `tenants.created_at` se queda literal. Los `jsonb` sin fechas (`questions`, `filters`, `parsed`, `evidence`, `flags`, `notes`, `behavioral`, `plural_only`, `story`, `choices`, `observations`) van como `sqlStr(JSON.stringify(x)) || '::jsonb'`. `seedTenantFunctionSql` genera una función plpgsql con `if p_tenant_id = 't_americana' then insert … end if;` por empresa. `resetDemoFunctionSql` genera:

```sql
create or replace function public.reset_demo(p_tenant_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from tenant_members m where m.tenant_id = p_tenant_id
      and m.email is not null and lower(m.email) = lower(coalesce(auth.email(), ''))
      and m.role in ('owner','admin','super_admin')) then
    raise exception 'Solo un jefe de RR.HH. o el administrador puede restablecer la demo';
  end if;
  delete from talent_actions_done where tenant_id = p_tenant_id;
  delete from jobs where tenant_id = p_tenant_id; -- cascada: candidatos, mensajes, evaluaciones
  delete from tenant_settings where tenant_id = p_tenant_id;
  delete from tenant_members where tenant_id = p_tenant_id and email is null;
  perform seed_tenant(p_tenant_id);
end $$;
```

- [ ] **Step 5: `scripts/gen-seed-sql.mjs`** — igual que `scripts/check-help-chat.mjs`: con `esbuild` empaqueta un entry que exporta `DEMO_NOW, TENANTS, USERS, JOBS, CANDIDATES` de `src/data/seed.ts` y `SEED_EVALUATIONS` de `src/data/seedEvaluations.ts` a `node_modules/.cache/seed-sql/bundle.mjs`, lo importa y escribe `supabase/migrations/0003_seed_functions.sql` con: cabecera `-- GENERADO por scripts/gen-seed-sql.mjs — no editar a mano`, `tenantsSql` (`on conflict (id) do nothing`), `membersSql` (`on conflict do nothing`), `seedTenantFunctionSql`, `resetDemoFunctionSql`, `grant execute on function public.reset_demo(text) to authenticated;`, `revoke all on function public.seed_tenant(text) from public;` y al final `select public.seed_tenant(id) from public.tenants;`. Script en `package.json`: `"gen:seed-sql": "node scripts/gen-seed-sql.mjs"`.

- [ ] **Step 6: Generar y revisar** — `npm run gen:seed-sql`; `grep -c "insert into candidates" supabase/migrations/0003_seed_functions.sql` ≥ 1; el archivo no contiene `2026-06-` salvo en `tenants.created_at`.

- [ ] **Step 7: Aplicar** — MCP `apply_migration` (`name: seed_functions`).

- [ ] **Step 8: Verificar conteos** — `execute_sql`:

```sql
select (select count(*) from tenants) t, (select count(*) from tenant_members) m,
       (select count(*) from jobs) j, (select count(*) from candidates) c,
       (select count(*) from interview_evaluations) e;
```
Esperado: `t = 3`, `m = 7` (Oscar ×3, Reynaldo, Jessica, Lucía, Diego), `j = 3`, `c` = total de `CANDIDATES` del seed, `e` = total de `SEED_EVALUATIONS`. Y `select min(applied_at), max(applied_at) from candidates where tenant_id='t_americana'` → fechas dentro de los últimos 30 días.

- [ ] **Step 9: Verificar RLS con un usuario simulado** — `execute_sql` en una sola llamada:

```sql
select set_config('request.jwt.claims', '{"email":"RRHH@Americana2000.com.gt","role":"authenticated"}', false);
set role authenticated;
select (select count(*) from candidates where tenant_id = 't_americana') americana,
       (select count(*) from candidates where tenant_id = 't_contacta') contacta,
       (select count(*) from tenants) tenants;
```
Esperado: `americana` > 0, `contacta = 0`, `tenants = 1` (correo en mayúsculas incluido). Terminar con `reset role;`.

- [ ] **Step 10: Verificar `reset_demo`** — con las mismas claims de Jessica (`recruiter`): `select public.reset_demo('t_americana');` → error "Solo un jefe…". Con `reynaldo.velasquez@americana2000.com.gt` (`admin`): ejecuta sin error y los conteos de `jobs`/`candidates` de `t_americana` son iguales a los del Step 8. Verificar también Review Focus 2: insertar un miembro sin correo, asignarle un candidato (`update candidates set owner_id = …`), borrar el miembro → `owner_id` queda `null` y el candidato existe.

- [ ] **Step 11: Commit**

```bash
git add scripts/seed-sql-lib.mjs scripts/seed-sql-lib.test.mjs scripts/gen-seed-sql.mjs supabase/migrations/0003_seed_functions.sql src/data/seed.ts package.json
git commit -m "feat(db): datos de ejemplo generados desde el seed con fechas relativas; seed_tenant y reset_demo"
```

---

### Task 4: Cliente Supabase y reglas de roles

**Files:**
- Create: `src/core/supabase.ts`, `src/core/roles.ts`, `src/core/roles.test.ts`

**Interfaces:**
- Produces: `supabase` (cliente de `@supabase/supabase-js`, `createClient(url, key)`); `canManage(role: UserRole): boolean` (owner/admin/super_admin); `isHrTeam(role: UserRole): boolean` (ni owner ni super_admin); `MISSING_ENV_MESSAGE = 'Falta configurar Supabase: define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.local (local) o en las variables del repositorio (GitHub Pages).'`.

- [ ] **Step 1: Prueba que falla** — `src/core/roles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canManage, isHrTeam } from './roles';

describe('roles', () => {
  it('solo jefes y administradores gestionan', () => {
    expect(canManage('owner')).toBe(true);
    expect(canManage('admin')).toBe(true);
    expect(canManage('super_admin')).toBe(true);
    expect(canManage('recruiter')).toBe(false);
  });
  it('el equipo de RR.HH. excluye owner y super_admin', () => {
    expect(isHrTeam('admin')).toBe(true);
    expect(isHrTeam('recruiter')).toBe(true);
    expect(isHrTeam('owner')).toBe(false);
    expect(isHrTeam('super_admin')).toBe(false);
  });
});
```

- [ ] **Step 2: Correr** — `npm test -- src/core/roles.test.ts` → FAIL.

- [ ] **Step 3: Implementar** `src/core/roles.ts` y `src/core/supabase.ts`. El cliente lee `import.meta.env.VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`; si falta alguna, `throw new Error(MISSING_ENV_MESSAGE)` al cargar el módulo (mismo patrón que `core/providers.ts`).

- [ ] **Step 4: Correr** — `npm test` → PASS; `npm run lint` OK.

- [ ] **Step 5: Commit**

```bash
git add src/core/supabase.ts src/core/roles.ts src/core/roles.test.ts
git commit -m "feat(core): cliente de Supabase y reglas de roles"
```

---

### Task 5: Repositorios — empresas, miembros, configuración, vacantes y candidatos

**Files:**
- Create: `src/core/db/tenants.ts`, `src/core/db/members.ts`, `src/core/db/settings.ts`, `src/core/db/jobs.ts`, `src/core/db/candidates.ts`, y un `*.test.ts` por archivo.

**Interfaces:**
- Consumes: `supabase` (Tarea 4); tipos `Tenant`, `User`, `Job`, `Candidate`, `CandidateStage`, `CandidateTimeline` de `src/types`; `TenantSettings` (se **mueve** de `SettingsContext.tsx` a `src/core/db/settings.ts` sin el campo `team`, y el context lo reexporta).
- Produces:
  - `tenants.ts`: `rowToTenant(r: TenantRow): Tenant`; `listMyTenants(): Promise<Tenant[]>` (`select *` ordenado por `name`).
  - `members.ts`: `rowToMember(r): User`, `memberToRow(u: User): MemberRow` (email `''` ↔ `null`); `listMembers(tenantId): Promise<User[]>`; `insertMember(u: User): Promise<void>`; `deleteMember(id: string): Promise<void>`; `listMyMemberships(email: string): Promise<User[]>` (`select *` y filtra `lower(email) === email.toLowerCase()` en cliente).
  - `settings.ts`: `TenantSettings { modules; autoReply; sla }`, `defaultSettings(): TenantSettings`; `rowToSettings(r): TenantSettings` (combina con `defaultSettings()`); `settingsToRow(tenantId, s): SettingsRow`; `getSettings(tenantId): Promise<TenantSettings | null>`; `upsertSettings(tenantId, s): Promise<void>`.
  - `jobs.ts`: `rowToJob`, `jobToRow`; `listJobs(tenantId): Promise<Job[]>` (orden `inserted_at desc`); `insertJob(job): Promise<void>`.
  - `candidates.ts`: `rowToCandidate`, `candidateToRow`; `listCandidates(tenantId): Promise<Candidate[]>`; `insertCandidate(c): Promise<void>`; `updateCandidate(id, patch: Partial<Pick<Candidate, 'stage' | 'timeline' | 'hiredAt' | 'ownerId'>>): Promise<void>`.
- Toda función de acceso lanza el `error` de supabase-js si viene (`if (error) throw error`).

- [ ] **Step 1: Pruebas de mapeo que fallan** — en cada `*.test.ts`, una prueba de ida y vuelta con un objeto completo del seed y otra con los opcionales ausentes. Ejemplo `candidates.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CANDIDATES } from '../../data/seed';
import { candidateToRow, rowToCandidate } from './candidates';

describe('candidates mapper', () => {
  it('ida y vuelta sin pérdida (candidato completo)', () => {
    const c = CANDIDATES.find((x) => x.id === 'cand_10')!;
    expect(rowToCandidate(candidateToRow(c))).toEqual(c);
  });
  it('los opcionales ausentes vuelven como undefined, no null', () => {
    const c = CANDIDATES.find((x) => x.screeningStatus === 'error')!;
    const back = rowToCandidate(candidateToRow(c));
    expect(back.screeningScore).toBeUndefined();
    expect(back).toEqual(c);
  });
});
```
Para `members.test.ts`: `email: ''` ↔ `email: null`. Para `settings.test.ts`: `rowToSettings({ tenant_id: 't', modules: {}, auto_reply: null, sla: { review: 9 } })` → `modules` de fábrica, `autoReply` de fábrica, `sla.review === 9` y el resto de fábrica.

- [ ] **Step 2: Correr** — `npm test` → FAIL en los 5 archivos nuevos.

- [ ] **Step 3: Implementar los 5 repositorios.** Los mapeos eliminan claves `undefined` al volver a objeto (`toEqual` falla con `{ x: undefined }` vs ausente: usar un helper `stripUndefined<T>(o: T): T` en `src/core/db/rows.ts`).

- [ ] **Step 4: Correr** — `npm test` → PASS; `npm run lint` OK.

- [ ] **Step 5: Commit**

```bash
git add src/core/db/
git commit -m "feat(db): repositorios de empresas, miembros, configuración, vacantes y candidatos"
```

---

### Task 6: Repositorios — mensajes, evaluaciones, preguntas de ayuda, acciones de Talento y reset

**Files:**
- Create: `src/core/db/outreach.ts`, `src/core/db/evaluations.ts`, `src/core/db/helpQuestions.ts`, `src/core/db/talentActions.ts`, `src/core/db/demo.ts`, y `*.test.ts` para los tres primeros.

**Interfaces:**
- Consumes: `OutreachMessage` (`src/types`), `InterviewEvaluation` (`src/core/interviewGuide`), `HelpQuestion` (`src/features/help/HelpContext.tsx` → **mover** la interfaz a `src/core/db/helpQuestions.ts` y reexportarla desde `HelpContext.tsx`).
- Produces:
  - `outreach.ts`: `rowToMessage`, `messageToRow`; `listMessages(tenantId): Promise<OutreachMessage[]>` (orden `sent_at desc`, límite 500); `insertMessage(m)`; `updateMessage(id, patch: Partial<Pick<OutreachMessage, 'status' | 'confirmedSlot'>>)`.
  - `evaluations.ts`: `rowToEvaluation`, `evaluationToRow`; `listEvaluations(tenantId): Promise<InterviewEvaluation[]>`; `upsertEvaluation(ev): Promise<void>` (`onConflict: 'candidate_id'`).
  - `helpQuestions.ts`: `HelpQuestion`; `rowToQuestion`; `listQuestions(tenantId): Promise<HelpQuestion[]>` (orden `asked_at desc`, límite 200); `insertQuestion(tenantId, memberId: string | null, q: Omit<HelpQuestion, 'id' | 'at'>): Promise<HelpQuestion>` (devuelve la fila insertada con `select()`); `deleteQuestions(tenantId): Promise<void>`.
  - `talentActions.ts`: `listDone(tenantId): Promise<string[]>`; `setDone(tenantId, personId, memberId: string | null): Promise<void>` (upsert); `unsetDone(tenantId, personId): Promise<void>`.
  - `demo.ts`: `resetDemo(tenantId): Promise<void>` → `supabase.rpc('reset_demo', { p_tenant_id: tenantId })`.

- [ ] **Step 1: Pruebas que fallan** — ida y vuelta para `outreach` (mensaje con y sin `confirmedSlot`), `evaluations` (`SEED_EVALUATIONS[0]`), `helpQuestions` (`rowToQuestion({ id: 'q1', asked_at: '2026-11-09T10:00:00.000Z', route: '/screening', question: '¿Qué?', answered: false, tenant_id: 't', member_id: null })` → `{ id: 'q1', at: '2026-11-09T10:00:00.000Z', route: '/screening', question: '¿Qué?', answered: false }`).

- [ ] **Step 2: Correr** — FAIL. **Step 3: Implementar.** **Step 4: Correr** — PASS; `npm run lint` OK.

- [ ] **Step 5: Commit**

```bash
git add src/core/db/ src/features/help/HelpContext.tsx
git commit -m "feat(db): repositorios de mensajes, evaluaciones, preguntas de ayuda, acciones de Talento y reset"
```

---

### Task 7: Sesión (login), empresas por membresía y pantallas de estado

**Files:**
- Create: `src/context/AuthContext.tsx`, `src/features/auth/LoginPage.tsx`, `src/features/auth/NoTenantPage.tsx`, `src/features/auth/AuthGate.tsx`, `src/components/StatusScreens.tsx`, `src/context/useTenantData.ts`, `src/context/useTenantData.test.ts`, `src/components/DataReadyGate.tsx`
- Modify: `src/context/TenantContext.tsx`, `src/components/layout/Topbar.tsx`, `src/App.tsx`, `src/main.tsx` (si `HelpProvider` o `BrowserRouter` deben envolver distinto: `grep -rn "HelpProvider\|BrowserRouter" src/main.tsx src/App.tsx src/components/layout/AppShell.tsx`)

**Interfaces:**
- Consumes: `supabase`, `listMyTenants`, `listMyMemberships`, `canManage`.
- Produces:
  - `useAuth(): { status: 'loading' | 'signed_out' | 'signed_in'; email: string | null; signIn(email: string, password: string): Promise<string | null>; signOut(): Promise<void> }`. `signIn` normaliza `email.trim().toLowerCase()`, llama `supabase.auth.signInWithPassword`, y devuelve `null` si entró o uno de estos mensajes: credenciales → `'Correo o contraseña incorrectos.'`; red/servidor → `'No se pudo conectar con el servidor. Si persiste, avísale a Oscar.'`.
  - `useTenant(): { tenant; plan; tenants; setTenantId; member: User; canManage: boolean; memberships: User[] }` (`member` = membresía del usuario en la empresa actual). La empresa elegida se guarda en `localStorage` `talentia.tenant.v1`; si no pertenece a las del usuario, se toma la primera.
  - `useTenantData<T>(load: (tenantId: string) => Promise<T>, initial: T): { data: T; setData: Dispatch<SetStateAction<T>>; ready: boolean; error: string | null; reload: () => void }`. Carga al montar y al cambiar `tenant.id`; recarga cuando `document.visibilitychange` pasa a `visible`; en error, `error` = mensaje de red de arriba y `ready` queda `true` con `data = initial`.
  - `LoadingScreen({ label }: { label: string })`, `ErrorScreen({ message, onRetry, onSignOut }: { message: string; onRetry?: () => void; onSignOut?: () => void })`.
  - `AuthGate({ children })`: `loading` → `LoadingScreen('Entrando…')`; `signed_out` → `LoginPage`; `signed_in` → `children`.
  - `DataReadyGate({ children })`: lee `ready`/`error`/`reload` de los contexts (Tareas 8–11 los exponen); mientras alguno no esté `ready` → `LoadingScreen('Cargando datos de la empresa…')`; si alguno tiene `error` → `ErrorScreen` con "Reintentar" (llama todos los `reload`) y "Cerrar sesión"; si no → `children`. En esta tarea solo consume `useTenant`; se amplía en las siguientes.
  - `LoginPage`: logo (`APP.name`), campos correo y contraseña, botón "Entrar" (deshabilitado mientras envía), error bajo el formulario, texto "¿Olvidaste tu contraseña? Pídele a Oscar que la restablezca."
  - `NoTenantPage`: "Tu cuenta no está asignada a ninguna empresa; avísale a Oscar." + botón "Cerrar sesión".
  - `Topbar`: a la derecha, nombre de `member.name` (oculto en móvil) y botón "Cerrar sesión".

- [ ] **Step 1: Prueba que falla** — `src/context/useTenantData.test.ts` (vitest con `environment: 'jsdom'`? No: probar la lógica pura). Extraer de `useTenantData` la función pura `shouldReloadOnVisibility(state: DocumentVisibilityState): boolean` y `networkMessage(err: unknown): string`, y probar:

```ts
import { describe, expect, it } from 'vitest';
import { networkMessage, shouldReloadOnVisibility } from './useTenantData';

describe('useTenantData helpers', () => {
  it('recarga solo al volver a estar visible', () => {
    expect(shouldReloadOnVisibility('visible')).toBe(true);
    expect(shouldReloadOnVisibility('hidden')).toBe(false);
  });
  it('convierte cualquier error en el mensaje de red', () => {
    expect(networkMessage(new TypeError('Failed to fetch'))).toBe('No se pudo conectar con el servidor. Si persiste, avísale a Oscar.');
  });
});
```
Y en `AuthContext.tsx` extraer `loginErrorMessage(err: { message?: string; status?: number } | null): string | null` con prueba: `status 400` o mensaje `Invalid login credentials` → `'Correo o contraseña incorrectos.'`; otro → mensaje de red; `null` → `null`. También `normalizeEmail(s: string): string` con prueba: `normalizeEmail(' Rrhh@Americana2000.com.gt ')` → `'rrhh@americana2000.com.gt'` (Review Focus 1).

- [ ] **Step 2: Correr** — FAIL.

- [ ] **Step 3: Implementar** los archivos listados. `TenantProvider` ahora requiere `useAuth().email`: carga `listMyMemberships(email)` y `listMyTenants()` en paralelo; mientras carga → `LoadingScreen('Cargando tu empresa…')`; sin membresías → `NoTenantPage`. Componer en `App.tsx`:

```
<AuthProvider><AuthGate><TenantProvider><SettingsProvider>…<EvaluationsProvider><TalentActionsProvider>
  <DataReadyGate><Routes>…</Routes></DataReadyGate>
</TalentActionsProvider>…</TenantProvider></AuthGate></AuthProvider>
```
(`TalentActionsProvider` llega en Tarea 10; dejar el hueco comentado.) `HelpProvider` debe quedar **dentro** de `TenantProvider` (mover desde donde esté si hace falta).

- [ ] **Step 4: Correr** — `npm test` PASS; `npm run lint` OK.

- [ ] **Step 5: Cuenta de prueba local** (solo para verificar en `localhost`; se elimina en Tarea 14). Generar una contraseña aleatoria con Bash (`openssl rand -base64 18`) y guardarla en `.env.local` como `TEST_LOGIN_EMAIL=prueba@talentia.local` y `TEST_LOGIN_PASSWORD=…` sin mostrarla en el chat. Crear el usuario con `execute_sql`:

```sql
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'prueba@talentia.local', extensions.crypt('<TEST_LOGIN_PASSWORD>', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
from auth.users u where u.email = 'prueba@talentia.local';
insert into public.tenant_members (id, tenant_id, email, name, role, title)
values ('u_prueba', 't_americana', 'prueba@talentia.local', 'Cuenta de prueba', 'admin', 'Pruebas');
```
Si `signInWithPassword` falla con esta cuenta, no insistir: pedir a Oscar que cree `prueba@talentia.local` desde el panel con esa contraseña (él la lee de `.env.local`).

- [ ] **Step 6: Verificar en el navegador** — `preview_start` del dev server (`.claude/launch.json` con `npm run dev`, puerto 3000). Sin sesión → pantalla de login. Credenciales malas → "Correo o contraseña incorrectos." Con la cuenta de prueba → entra, la barra muestra "Cuenta de prueba" y "Cerrar sesión"; `read_console_messages` sin errores. "Cerrar sesión" → vuelve al login. Recargar con sesión → entra directo. **Review Focus 4:** con la sesión iniciada, cambiar temporalmente `VITE_SUPABASE_URL` en `.env.local` a `https://invalido.supabase.co`, reiniciar el dev server y recargar → debe verse `ErrorScreen` con "Reintentar" y "Cerrar sesión", nunca una pantalla en blanco (si la sesión no se restaura y cae al login, el login debe mostrar el mensaje de red); restaurar la URL y reiniciar.

- [ ] **Step 7: Commit**

```bash
git add src/context/AuthContext.tsx src/features/auth/ src/components/StatusScreens.tsx src/components/DataReadyGate.tsx src/context/useTenantData.ts src/context/useTenantData.test.ts src/context/TenantContext.tsx src/components/layout/Topbar.tsx src/App.tsx src/main.tsx
git commit -m "feat(auth): inicio de sesión con correo y contraseña; empresas según membresía"
```

---

### Task 8: Configuración y vacantes desde Supabase

**Files:**
- Modify: `src/context/SettingsContext.tsx`, `src/context/JobsContext.tsx`, `src/features/settings/SettingsPage.tsx` (botón quitar solo si `!u.email`), `src/components/DataReadyGate.tsx`

**Interfaces:**
- Consumes: `useTenantData`, repos de Tarea 5, `isHrTeam`, `notifyError`.
- Produces: `useSettings()` conserva `settings, isModuleEnabled, setModuleEnabled, setAutoReply, setSla, addTeamMember, removeTeamMember, hrTeam` y agrega `ready: boolean`, `error: string | null`, `reload()`. `useJobs()` conserva `jobs, addJob` y agrega `ready, error, reload`.

- [ ] **Step 1: `SettingsContext`** — `useTenantData` con `load = (t) => Promise.all([getSettings(t), listMembers(t)])`. `settings` = fila o `defaultSettings()`. Mutaciones de settings: estado local → `upsertSettings` (revertir si falla). `hrTeam = members.filter(m => isHrTeam(m.role))`. `addTeamMember(name, title)` inserta `{ id: newId('u'), tenantId, name: name.trim(), email: '', role: 'recruiter', title: title.trim() }`. `removeTeamMember(id)` solo si el miembro tiene `email === ''`. Quitar `localStorage`, `USERS` y el tipo `TeamMember`.

- [ ] **Step 2: `JobsContext`** — `useTenantData(listJobs, [])`; `addJob(job)`: antepone y `insertJob` (revertir si falla). Quitar `JOBS` y `localStorage`. Las vacantes ya llegan filtradas por empresa (RLS + `eq('tenant_id')`); las páginas que filtran por `tenantId` siguen funcionando.

- [ ] **Step 3: `DataReadyGate`** — incorporar `useSettings()` y `useJobs()`.

- [ ] **Step 4: Verificar en el navegador** — con la cuenta de prueba: Configuración muestra a Reynaldo y Jessica (sin botón de quitar) → agregar "Ana Prueba / Reclutadora" → aparece con botón quitar → recargar: sigue → quitar → desaparece. Cambiar meta "revisar" a 3 → recargar: sigue en 3. Encender Entrevistas IA → recargar: sigue encendido. Vacantes: crear una vacante con el asistente → recargar: sigue; en ventana privada, entrar con la misma cuenta: la vacante está. `read_console_messages` sin errores.

- [ ] **Step 5: `npm run lint`, `npm test` OK. Commit**

```bash
git add src/context/SettingsContext.tsx src/context/JobsContext.tsx src/features/settings/SettingsPage.tsx src/components/DataReadyGate.tsx
git commit -m "feat(data): configuración, equipo y vacantes guardados en Supabase"
```

---

### Task 9: Candidatos, línea de tiempo automática y bandeja de respuestas

**Files:**
- Create: `src/core/stages.ts`, `src/core/stages.test.ts`
- Modify: `src/context/CandidatesContext.tsx`, `src/context/OutreachContext.tsx`, `src/features/screening/ScreeningPage.tsx`, `src/components/DataReadyGate.tsx`

**Interfaces:**
- Consumes: repos `candidates.ts`, `outreach.ts`; `todayISO`; `useTenant().member`.
- Produces:
  - `applyStage(c: Candidate, stage: CandidateStage, today: string): Candidate` (pura): `offer` → `timeline.offered = today` y `timeline.interviewed ??= today`; `rejected` → `timeline.rejected = today`; `hired` → `hiredAt = today`; `interview` → solo `stage`; nunca sobreescribe una fecha ya existente salvo `stage`.
  - `applyReplied(c: Candidate, today: string): Candidate`: `timeline.replied ??= today`.
  - `useCandidates()` conserva `candidates, addCandidate, markInterviewScheduled, setStage` y agrega `markReplied(candidateId: string)`, `ready, error, reload`. `addCandidate(c)` completa `ownerId = member.id`, `appliedAt = todayISO()`, `timeline = { screened: todayISO() }` cuando el candidato viene `scored` (los `error` solo `appliedAt`).
  - `useOutreach()` conserva su API y agrega `ready, error, reload`; tras `delivered` llama `markReplied(candidate.id)`.

- [ ] **Step 1: Prueba que falla** — `src/core/stages.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CANDIDATES } from '../data/seed';
import { applyReplied, applyStage } from './stages';

const base = { ...CANDIDATES.find((c) => c.id === 'cand_05')!, timeline: {} };

describe('applyStage', () => {
  it('oferta fija offered e interviewed si faltaba', () => {
    const c = applyStage(base, 'offer', '2026-11-09');
    expect(c.stage).toBe('offer');
    expect(c.timeline).toEqual({ offered: '2026-11-09', interviewed: '2026-11-09' });
  });
  it('no pisa fechas existentes', () => {
    const c = applyStage({ ...base, timeline: { interviewed: '2026-11-01' } }, 'offer', '2026-11-09');
    expect(c.timeline?.interviewed).toBe('2026-11-01');
  });
  it('descartado fija rejected; contratado fija hiredAt', () => {
    expect(applyStage(base, 'rejected', '2026-11-09').timeline?.rejected).toBe('2026-11-09');
    expect(applyStage(base, 'hired', '2026-11-09').hiredAt).toBe('2026-11-09');
  });
  it('applyReplied solo la primera vez', () => {
    const once = applyReplied(base, '2026-11-01');
    expect(applyReplied(once, '2026-11-09').timeline?.replied).toBe('2026-11-01');
  });
});
```

- [ ] **Step 2: Correr** — FAIL. **Step 3: Implementar `stages.ts`.** **Step 4: Correr** — PASS.

- [ ] **Step 5: `CandidatesContext`** — `useTenantData(listCandidates, [])`; quitar `CANDIDATES`, `localStorage`, `Store`/`stages`. `setStage` usa `applyStage` y persiste con `updateCandidate(id, { stage, timeline, hiredAt })`; `markInterviewScheduled` conserva la regla de etapas tempranas y persiste `{ stage: 'interview' }`; `markReplied` usa `applyReplied` y persiste `{ timeline }`.

- [ ] **Step 6: `OutreachContext`** — `useTenantData(listMessages, [])`; al cargar, resolver los mensajes `queued/delivered` con `simulatedReply` como hoy **y** persistir cada cambio con `updateMessage`; `send` inserta con `insertMessage`, `patch` persiste con `updateMessage`; tras `delivered`, `markReplied`. Quitar `localStorage`.

- [ ] **Step 7: `ScreeningPage`** — `appliedAt: todayISO()` en `makeScoredCandidate`/`makeErrorCandidate` (quitar `'2026-06-15'`); bajo el `PageHeader`, aviso con `Badge variant="amber"`: "En esta etapa de prueba la lectura y el puntaje del CV son simulados; los CVs cargados sí se guardan para todo el equipo."

- [ ] **Step 8: `DataReadyGate`** — incorporar `useCandidates()` y `useOutreach()`.

- [ ] **Step 9: Verificar en el navegador** — Screening → "Cargar ejemplos" → 4 candidatos (3 puntuados, 1 error) → recargar: siguen; Respuestas a CVs → enviar a 2 → bandeja con estados → recargar: estados conservados; Candidatos: el confirmado está en Entrevista. En SQL: `select owner_id, applied_at, timeline from candidates where source = 'Carga directa'` → `owner_id = 'u_prueba'`, `applied_at = hoy`, `timeline` con `screened` y `replied`.

- [ ] **Step 10: `npm run lint`, `npm test` OK. Commit**

```bash
git add src/core/stages.ts src/core/stages.test.ts src/context/CandidatesContext.tsx src/context/OutreachContext.tsx src/features/screening/ScreeningPage.tsx src/components/DataReadyGate.tsx
git commit -m "feat(data): candidatos y bandeja en Supabase; línea de tiempo automática por acción de RR.HH."
```

---

### Task 10: Evaluaciones de entrevista y acciones de Talento

**Files:**
- Create: `src/context/TalentActionsContext.tsx`
- Modify: `src/context/EvaluationsContext.tsx`, `src/features/talent/ActionsPage.tsx`, `src/App.tsx`, `src/components/DataReadyGate.tsx`

**Interfaces:**
- Consumes: repos `evaluations.ts`, `talentActions.ts`; `useTenant().member`.
- Produces: `useEvaluations()` conserva `evaluations, saveEvaluation, updateEvaluation` y agrega `ready, error, reload`. `useTalentActions(): { done: Set<string>; toggleDone(personId: string): void; ready; error; reload }`.

- [ ] **Step 1: `EvaluationsContext`** — `useTenantData(listEvaluations, {})` (mapa por `candidateId`); `saveEvaluation`/`updateEvaluation` fijan `updatedAt` y persisten con `upsertEvaluation`. Quitar `SEED_BY_ID` y `localStorage`.

- [ ] **Step 2: `TalentActionsContext`** — `useTenantData(listDone, [])` → `Set`; `toggleDone` → `setDone(tenantId, personId, member.id)` o `unsetDone`. `ActionsPage` reemplaza `useState(done)` y `toggleDone` por el hook. Registrar el provider en `App.tsx` y en `DataReadyGate`.

- [ ] **Step 3: Verificar** — Entrevistas (`/competencias`): evaluar a María González hasta el reporte → recargar: la evaluación sigue → "Pasar a Oferta" → Candidatos la muestra en Oferta; SQL: `select count(*) from interview_evaluations where candidate_id = (select id from candidates where first_name = 'María' and tenant_id = 't_americana')` → `1` tras guardar dos veces (Review Focus 5). Acciones RR.HH.: marcar una acción como completada → recargar: sigue en "Completadas".

- [ ] **Step 4: `npm run lint`, `npm test` OK. Commit**

```bash
git add src/context/EvaluationsContext.tsx src/context/TalentActionsContext.tsx src/features/talent/ActionsPage.tsx src/App.tsx src/components/DataReadyGate.tsx
git commit -m "feat(data): evaluaciones de entrevista y acciones de Talento en Supabase"
```

---

### Task 11: Preguntas al chat y "Restablecer la demo" para toda la empresa

**Files:**
- Modify: `src/features/help/HelpContext.tsx`, `src/features/settings/SettingsPage.tsx`, `src/features/help/PilotGuidePage.tsx` (línea 87), `src/features/help/moduleGuides.ts`, `src/features/help/tourSteps.ts` (textos "en este navegador")

**Interfaces:**
- Consumes: repos `helpQuestions.ts`, `demo.ts`; `useTenant().canManage`.
- Produces: `useHelp()` conserva su API; `questions` vienen de la base; `logQuestion` inserta (`memberId = member.id`) y antepone la fila devuelta; `clearQuestions` llama `deleteQuestions`. `welcomeSeen`, `tourDone`, `moduleToursDone` siguen en `localStorage` `talentia.help.v1` (quitar `questions` de ese estado).

- [ ] **Step 1: `HelpContext`** — `useTenantData(listQuestions, [])` para preguntas (si `HelpProvider` no está dentro de `TenantProvider`, moverlo: Tarea 7 Step 3). Tope 200 en memoria.

- [ ] **Step 2: `SettingsPage`** — `resetDemo()`: `confirm('Se borrarán, para TODA la empresa, las vacantes creadas, CVs cargados, mensajes enviados, evaluaciones de entrevista, metas, módulos y personas agregadas al equipo, y volverán los datos de ejemplo. Las preguntas al chat se conservan. ¿Restablecer la demo?')` → `await resetDemo(tenant.id)` → `window.location.href = import.meta.env.BASE_URL`; en error → `notifyError('No se pudo restablecer la demo. ' + mensaje)`. Botón visible solo si `canManage`; texto "Restablecer la demo de la empresa". Botón "Borrar" de preguntas visible solo si `canManage`. Mantener "Enviar a Oscar" (mailto) tal cual.

- [ ] **Step 3: Textos** — `grep -rn "en este navegador\|este navegador" src` y reemplazar por la idea "para toda la empresa / queda guardado en la nube" en `PilotGuidePage.tsx:87`, `moduleGuides.ts`, `tourSteps.ts` y `helpFaq.ts` (la FAQ se completa en Tarea 13).

- [ ] **Step 4: Verificar** — Chat de ayuda: preguntar "¿xyz?" (sin respuesta) → Configuración muestra la pregunta "Sin respuesta" → recargar: sigue. Restablecer la demo (cuenta de prueba es `admin`) → confirmación → recarga → los 4 CVs de ejemplo cargados ya no están, las vacantes creadas tampoco, la pregunta al chat sigue. SQL con claims de `recruiter` → `reset_demo` sigue negado (Tarea 3 Step 10).

- [ ] **Step 5: `npm run lint`, `npm test`, `npm run check:help` OK. Commit**

```bash
git add src/features/help/HelpContext.tsx src/features/settings/SettingsPage.tsx src/features/help/PilotGuidePage.tsx src/features/help/moduleGuides.ts src/features/help/tourSteps.ts src/data/helpFaq.ts
git commit -m "feat(help): preguntas al chat en Supabase; restablecer la demo para toda la empresa"
```

---

### Task 12: Dashboard y Métricas con candidatos reales y fecha de hoy

**Files:**
- Modify: `src/features/dashboard/DashboardPage.tsx`, `src/features/metrics/MetricsPage.tsx`
- Test: `src/features/metrics/hrMetrics.test.ts` (nuevo)

**Interfaces:**
- Consumes: `useCandidates().candidates`, `useJobs().jobs`, `todayISO()`.

- [ ] **Step 1: Prueba que falla** — `hrMetrics.test.ts` (Review Focus 2):

```ts
import { describe, expect, it } from 'vitest';
import { CANDIDATES, USERS } from '../../data/seed';
import { DEFAULT_SLA, recruiterStats, teamKpis } from './hrMetrics';

describe('hrMetrics con dueño nulo', () => {
  const cands = CANDIDATES.filter((c) => c.tenantId === 't_americana').map((c, i) => (i === 0 ? { ...c, ownerId: undefined } : c));
  const users = USERS.filter((u) => u.tenantId === 't_americana' && u.role !== 'owner' && u.role !== 'super_admin');
  it('no lanza y no inventa personas', () => {
    expect(() => recruiterStats(cands, users, '2026-11-09', DEFAULT_SLA)).not.toThrow();
    expect(recruiterStats(cands, users, '2026-11-09', DEFAULT_SLA).map((r) => r.user.id)).toEqual(users.map((u) => u.id));
    expect(teamKpis(cands, [], users, '2026-11-09', DEFAULT_SLA)).toBeTruthy();
  });
});
```
(Si `RecruiterStats` no tiene `user`, usar el campo que identifica a la persona.)

- [ ] **Step 2: Correr** — si FALLA por `ownerId` nulo, corregir `hrMetrics.ts` para ignorar candidatos sin dueño en los agregados por persona (siguen contando en los totales del equipo). Si PASA de entrada, dejar la prueba.

- [ ] **Step 3: Dashboard y Métricas** — reemplazar `CANDIDATES.filter(...)` por `useCandidates().candidates`; `DEMO_NOW` → `todayISO()`; en Métricas, "Corte al …" muestra la fecha de hoy y el pie "Datos de demostración con corte al …" pasa a "Los tiempos se calculan con las fechas en que RR.HH. movió a cada candidato de etapa; los CVs ilegibles no cuentan para los promedios pero sí aparecen como pendientes." `USAGE_EVENTS` se queda (consumo de ejemplo hasta la Entrega B). Quitar los imports de `CANDIDATES` y `DEMO_NOW`.

- [ ] **Step 4: Verificar** — `grep -rn "DEMO_NOW" src --include=*.tsx` → sin resultados. En el navegador: cargar un CV de ejemplo → Dashboard cuenta un candidato más en Screening y Métricas lo lista como pendiente de "responder" para "Cuenta de prueba".

- [ ] **Step 5: `npm run lint`, `npm test` OK. Commit**

```bash
git add src/features/dashboard/DashboardPage.tsx src/features/metrics/MetricsPage.tsx src/features/metrics/hrMetrics.ts src/features/metrics/hrMetrics.test.ts
git commit -m "feat(metrics): Dashboard y Métricas con los candidatos reales y la fecha de hoy"
```

---

### Task 13: Ayuda: preguntas nuevas del chat y banco de pruebas

**Files:**
- Modify: `src/data/helpFaq.ts`, `scripts/help-chat-cases.mjs`

- [ ] **Step 1: Casos nuevos primero** — en `help-chat-cases.mjs`, siguiendo el formato existente, agregar casos que esperen: `login` ← "¿por qué tengo que iniciar sesión?", "no puedo entrar", "me pide usuario y contraseña", "cerrar sesión"; `contrasena` ← "¿cómo cambio mi contraseña?", "olvidé mi contraseña", "restablecer contraseña"; `guardado` ← "¿se guarda lo que hago?", "¿lo ven los demás?", "se me borró lo que cargué", "¿puedo entrar desde el celular?". Correr `npm run check:help` → FALLA en esos casos.

- [ ] **Step 2: Entradas en `helpFaq.ts`** — `login` (respuesta: la demo es compartida por todo el equipo y está en internet, por eso cada quien entra con su correo y contraseña; las cuentas las crea Oscar; "Cerrar sesión" arriba a la derecha), `contrasena` (pedírsela a Oscar, quien la restablece desde el panel; no hay correo automático), `guardado` (todo lo que ingresas se guarda en la nube y lo ven todos al recargar; también desde el celular; "Restablecer la demo" lo deshace para toda la empresa y solo un jefe u Oscar puede hacerlo). Ajustar `restablecer` y `configuracion`. Cuidar que "contraseña" no robe las preguntas de `login`: palabras clave distintas (`contraseña`, `clave`, `olvidé` vs `iniciar sesión`, `entrar`, `usuario`, `cerrar sesión`).

- [ ] **Step 3: Correr** — `npm run check:help` → todos en verde (anotar el total nuevo para ESTADO.md).

- [ ] **Step 4: Commit**

```bash
git add src/data/helpFaq.ts scripts/help-chat-cases.mjs
git commit -m "feat(help): el chat explica el inicio de sesión, la contraseña y el guardado compartido"
```

---

### Task 14: Publicación: variables del repo, workflow y tarea diaria; limpieza de la cuenta de prueba

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Create: `.github/workflows/keep-supabase-awake.yml`
- Modify: `supabase/README.md`

- [ ] **Step 1: Variables del repositorio** (valores leídos de `.env.local` con Bash, sin imprimirlos):

```bash
gh variable set VITE_SUPABASE_URL --repo Oscarim79/Talentia-2.0 --body "$(grep ^VITE_SUPABASE_URL= .env.local | cut -d= -f2-)"
gh variable set VITE_SUPABASE_PUBLISHABLE_KEY --repo Oscarim79/Talentia-2.0 --body "$(grep ^VITE_SUPABASE_PUBLISHABLE_KEY= .env.local | cut -d= -f2-)"
gh variable list --repo Oscarim79/Talentia-2.0
```

- [ ] **Step 2: `deploy-pages.yml`** — en el paso `npm run build`, agregar al `env`: `VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}` y `VITE_SUPABASE_PUBLISHABLE_KEY: ${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY }}`.

- [ ] **Step 3: `keep-supabase-awake.yml`** — `on: schedule: - cron: '17 12 * * *'` y `workflow_dispatch`; un job con un paso:

```bash
curl -fsS -X POST "${{ vars.VITE_SUPABASE_URL }}/rest/v1/rpc/ping" \
  -H "apikey: ${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY }}" -H "Content-Type: application/json" -d '{}'
```
Comentario arriba: "Supabase gratis pausa el proyecto tras 7 días sin consultas; este ping diario lo mantiene activo."

- [ ] **Step 4: Probar el ping en local** — el mismo `curl` con los valores de `.env.local` → responde `3`.

- [ ] **Step 5: `supabase/README.md`** — sección "Mantenimiento": tarea diaria, qué hacer si el proyecto aparece pausado (Resume en el panel), cómo crear usuarios (panel → Authentication → Users → Add user → Auto Confirm) y dónde apagar el registro público.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/deploy-pages.yml .github/workflows/keep-supabase-awake.yml supabase/README.md
git commit -m "ci: variables de Supabase en el build de Pages y ping diario para evitar la pausa"
```

---

### Task 15: Verificación final, documentación, PR y pasos de Oscar

**Files:**
- Modify: `ESTADO.md`, `CLAUDE.md` (línea del stack: "Demo con mocks (`DEMO_MODE = true`) **y datos en Supabase** (Entrega A, 2026-11); la IA real va en la Entrega B")

- [ ] **Step 1: Verificación completa en local** — `npm run lint && npm test && npm run check:help && npm run build` en verde. Con la cuenta de prueba (`prueba@talentia.local`, nunca con la cuenta real de Oscar) recorrer: login → vacante → CVs → respuesta → evaluación → acción de Talento → pregunta al chat → recargar y ventana privada → Dashboard/Métricas → restablecer → cerrar sesión. Móvil (`resize_window` mobile): login y barra sin scroll horizontal.

- [ ] **Step 1b: Eliminar la cuenta de prueba** — primero "Restablecer la demo" con ella para limpiar lo que creó; luego `execute_sql`: `delete from public.tenant_members where id = 'u_prueba'; delete from auth.users where email = 'prueba@talentia.local';` (identities caen en cascada). Quitar `TEST_LOGIN_*` de `.env.local`. Verificar: `select count(*) from auth.users where email = 'prueba@talentia.local'` → `0`.

- [ ] **Step 2: `grep -rn "localStorage" src`** → solo `talentia.help.v1` (preferencias de ayuda) y `talentia.tenant.v1` (empresa elegida). `grep -rn "from '../data/seed'\|from '../../data/seed'" src` → solo `AdminPage.tsx`, `TalentPage.tsx`, `ActionsPage.tsx`, `ManagerReportModal.tsx`, `PersonProfileModal.tsx`, `DashboardPage.tsx` (`USAGE_EVENTS`) y los tests.

- [ ] **Step 3: `ESTADO.md`** — nuevo bloque al inicio: qué cambió (base compartida, login, restablecer por empresa, keep-alive), proyecto Supabase y org, dónde están las variables (`.env.local`, variables del repo), cómo crear usuarios, qué sigue (Entrega B), y la nota de que el borrador local del 2026-10-19 está en `git stash` (`stash@{0}`) y puede borrarse con `git stash drop` cuando Oscar confirme que no lo necesita.

- [ ] **Step 4: Instrucciones para Oscar (en el chat, antes del merge)** — crear las tres cuentas con los correos exactos (panel → Authentication → Users → Add user → Create new user, marcar "Auto Confirm User") y apagar "Allow new users to sign up". Verificar con `execute_sql`: `select lower(email) from auth.users order by 1` → los tres correos. **No continuar al merge hasta verlos.**

- [ ] **Step 5: PR** — `git push -u origin supabase-persistencia` y `gh pr create` con título "feat: datos compartidos en Supabase + inicio de sesión (Entrega A)" y cuerpo con resumen, pasos manuales hechos y verificación; terminar con `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Tras el merge (Oscar o `gh pr merge --squash`), esperar el despliegue de Pages y verificar en vivo: `curl -s https://oscarim79.github.io/Talentia-2.0/ | grep -c "<div id=\"root\">"` → 1; abrir la URL en el navegador integrado → muestra el login; credenciales inválidas → "Correo o contraseña incorrectos." (señal de conectividad con Supabase). Ejecutar una vez `keep-supabase-awake` con `workflow_dispatch` y confirmar que termina en verde.

- [ ] **Step 6: Commit de documentación y cierre**

```bash
git add ESTADO.md CLAUDE.md
git commit -m "docs: ESTADO.md — Entrega A publicada (Supabase + login)"
```
