# IA real para CVs (Entrega B) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que Screening IA guarde el CV original en Storage privado y lo lea y puntúe de verdad con Claude Sonnet 5.5 a través de una Edge Function de Supabase, con cola de errores reintentable y registro de consumo.

**Architecture:** El navegador crea el candidato en estado `pending`, sube el archivo a `cvs/<tenant>/<candidato>/…` y llama a la Edge Function `screen-cv` con solo `{ candidateId }`; la función lee candidato y vacante con el JWT del usuario (RLS), descarga el archivo, pide a Claude una respuesta JSON con esquema fijo, registra el consumo en `ai_calls` y devuelve el resultado; el navegador actualiza el candidato. La lógica pura de la función vive en `logic.ts` (sin Deno) y se prueba con vitest.

**Tech Stack:** Vite + React 19 + TS, Supabase (Postgres, Storage, Edge Functions en Deno), `@supabase/supabase-js`, `@anthropic-ai/sdk` 1.x (vía `npm:` en Deno), `mammoth` (Word → texto en el navegador), vitest.

**Spec:** `docs/superpowers/specs/2026-11-10-ia-real-cvs-design.md`

## Global Constraints

- Modelo `claude-sonnet-5-5`, `output_config.effort = 'medium'`, `max_tokens = 4096`, sin `thinking` explícito, sin streaming, `timeout` 120 000 ms, `maxRetries` 1.
- Bucket `cvs` privado, 10 MB (10 485 760 bytes), tipos: `application/pdf`, `image/jpeg`, `image/png`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`.
- Ruta del CV: `<tenant_id>/<candidate_id>/<nombre-seguro>`; texto de Word: `<tenant_id>/<candidate_id>/texto.txt`.
- Tope diario `DAILY_LIMIT = 300` llamadas por empresa (la llamada 301 del día recibe `daily_limit`).
- Precios para el costo estimado (US$ por millón de tokens): entrada 2, salida 10, lectura de caché 0.10, escritura de caché 2.50.
- Códigos de error exactamente los de la sección 10 del spec; etiquetas en español tal como ahí.
- La función responde HTTP 200 con `{ ok:false, errorReason }` para todo error de negocio; 400 solo si falta `candidateId`.
- La función **no** escribe en `candidates`; solo inserta en `ai_calls`.
- `npm test`, `npm run lint`, `npm run build`, `npm run check:help` deben pasar al cerrar cada tarea que toque su área.
- Textos de la app en español sencillo; nada de claves en el repo ni en el chat.

## Review Focus

1. Extensión en mayúsculas (`CV.PDF`, `Foto.JPG`): se acepta y se sube con el tipo correcto. → test en Tarea 6 (`validateFile`, `mimeFor`).
2. Nombre de archivo con acentos, espacios o caracteres raros (`Currículum José (final).pdf`): la ruta en Storage queda solo con `a-z0-9._-`. → test en Tarea 6 (`safeFileName`).
3. Claude devuelve evidencia para criterios que no existen, repite uno u omite otro: la lista final tiene exactamente una entrada por criterio imprescindible, en el orden de la vacante. → test en Tarea 2 (`normalizeOutput`).
4. Puntajes fuera de rango o decimales (`score: 101.6`, `matchPercent: -3`): se recortan a 0–100 y se redondean a entero. → test en Tarea 2.
5. La pestaña se cerró a media carga: los candidatos `pending` que no están en el lote actual se muestran con "Quedó pendiente" y Reintentar, no con un spinner eterno. → test en Tarea 7 (`pendingState`).

---

### Task 1: Migración 0006 (Storage, `cv_path`, `ai_calls`)

**Files:**
- Create: `supabase/migrations/0006_ia_cvs.sql`
- Modify: `supabase/README.md` (tabla de migraciones + sección "IA real para CVs")

**Interfaces:**
- Produces: bucket `cvs`; columna `public.candidates.cv_path text`; tabla `public.ai_calls` (columnas de la sección 6 del spec); políticas RLS `cvs_select/cvs_insert/cvs_update/cvs_delete` sobre `storage.objects` y `ai_calls_select/ai_calls_insert` sobre `public.ai_calls`.

- [ ] **Step 1: Escribir `0006_ia_cvs.sql`**

Contenido, en este orden:
1. `alter table public.candidates add column if not exists cv_path text;`
2. `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('cvs','cvs',false,10485760, array[...5 tipos...]) on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;`
3. Cuatro políticas sobre `storage.objects` para `authenticated` (`drop policy if exists` + `create policy`), condición `bucket_id = 'cvs' and (storage.foldername(name))[1] in (select public.my_tenant_ids())` en `using` y en `with check` donde aplique.
4. `create table if not exists public.ai_calls (id text primary key, tenant_id text not null references public.tenants(id) on delete cascade, candidate_id text references public.candidates(id) on delete set null, kind text not null, model text not null, input_tokens int not null default 0, output_tokens int not null default 0, cache_read_tokens int not null default 0, cache_write_tokens int not null default 0, cost_usd numeric(10,6) not null default 0, ok boolean not null, error text, created_at timestamptz not null default now());` + índice `ai_calls_tenant_created_idx (tenant_id, created_at)`.
5. `alter table public.ai_calls enable row level security;` políticas `ai_calls_select` (select) y `ai_calls_insert` (insert con check) para `authenticated` con `tenant_id in (select public.my_tenant_ids())`.
6. `revoke all on public.ai_calls from anon; revoke all on public.ai_calls from authenticated; grant select, insert on public.ai_calls to authenticated;`

- [ ] **Step 2: Aplicar la migración en el proyecto `zdvcvazybuupalvjacnh`**

Con la herramienta `apply_migration` (name `ia_cvs`, query = contenido exacto del archivo).
Expected: sin error.

- [ ] **Step 3: Verificar con `execute_sql`**

```sql
select (select count(*) from storage.buckets where id='cvs' and public=false) as bucket,
       (select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'cvs_%') as storage_policies,
       (select count(*) from information_schema.columns where table_name='candidates' and column_name='cv_path') as cv_path,
       (select count(*) from pg_policies where tablename='ai_calls') as ai_policies;
```
Expected: `bucket=1, storage_policies=4, cv_path=1, ai_policies=2`.

- [ ] **Step 4: Documentar en `supabase/README.md`**

Fila `0006_ia_cvs.sql` en la tabla; sección nueva "IA real para CVs" con: qué guarda el bucket, el secreto `ANTHROPIC_API_KEY` (Edge Functions → Secrets), cómo se despliega `screen-cv` (herramienta `deploy_edge_function` o `supabase functions deploy screen-cv`), tope diario y tamaño máximo, y que `ai_calls` no se borra con `reset_demo`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0006_ia_cvs.sql supabase/README.md
git commit -m "feat(supabase): bucket cvs, cv_path y tabla ai_calls (migración 0006)"
```

---

### Task 2: Lógica pura de la función `screen-cv` (`logic.ts`)

**Files:**
- Create: `supabase/functions/screen-cv/logic.ts`
- Test: `supabase/functions/screen-cv/logic.test.ts`
- Modify: `tsconfig.json:20` → `"include": ["src", "vite.config.ts", "supabase/functions/**/logic.ts", "supabase/functions/**/*.test.ts"]`

**Interfaces:**
- Produces (todo exportado desde `logic.ts`, sin importar nada de Deno ni de `src/`):
  - `export const MODEL = 'claude-sonnet-5-5'; EFFORT = 'medium'; MAX_TOKENS = 4096; DAILY_LIMIT = 300; MAX_FILE_BYTES = 10_485_760;`
  - `export const SYSTEM_PROMPT: string` (reclutador experto de retail en Guatemala; extrae y evalúa; evidencia = cita textual, nunca inventada; si no es CV o es ilegible → `readable:false`; español; rúbrica: imprescindibles, experiencia relevante y años, excluyentes → `flags` y penalización; `matchPercent` = coincidencia global).
  - `export const OUTPUT_SCHEMA: Record<string, unknown>` — JSON Schema con `additionalProperties:false` y `required` completos: `{ readable:boolean, unreadableReason: 'illegible'|'not_a_cv'|'other'|'', person:{firstName,lastName,email,phone: string}, parsed:{ skills:string[], experience:{company,role: string, years:number}[], totalYears:number, education:string }, score:{ score:number, matchPercent:number, justification:string, evidence:{criterion:string, matched:boolean, quote:string}[], flags:string[] } }`.
  - `export interface JobCriteria { title: string; mustHaves: string[]; negatives: string[] }`
  - `export function criteriaFromFilters(title: string, filters: { criterion: string; polarity: 'positive'|'negative' }[] | null): JobCriteria`
  - `export function buildUserText(job: JobCriteria, source: 'pdf'|'image'|'text'): string` (incluye título, imprescindibles y excluyentes numerados; para `text` dice que el CV viene convertido de Word).
  - `export type ErrorCode = 'unsupported_format'|'too_large'|'upload_failed'|'illegible_pdf'|'not_a_cv'|'password_protected'|'corrupt'|'ai_not_configured'|'ai_refused'|'ai_error'|'daily_limit'|'not_found'`
  - `export interface ScreenOk { ok: true; person: {firstName;lastName;email;phone}; parsed: {...}; score: {...} }` / `export interface ScreenFail { ok: false; errorReason: ErrorCode }` / `export type ScreenResult = ScreenOk | ScreenFail`
  - `export function normalizeOutput(raw: unknown, mustHaves: string[]): ScreenResult`
  - `export function interpretResponse(resp: { stop_reason: string | null; content: { type: string; text?: string }[] }, mustHaves: string[]): ScreenResult`
  - `export function mapApiError(err: { status?: number; message?: string; name?: string }): ErrorCode`
  - `export function isOverDailyLimit(countToday: number): boolean`
  - `export function kindFromPath(path: string): { kind: 'pdf'|'image'|'text'; mediaType: string } | null` (`.pdf` → pdf/application/pdf; `.jpg/.jpeg` → image/jpeg; `.png` → image/png; `.docx` → text/text/plain; otro → null)
  - `export function textPathFor(cvPath: string): string` (misma carpeta + `texto.txt`)
  - `export function estimateCostUsd(usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }): number` (redondeado a 6 decimales)

- [ ] **Step 1: Escribir las pruebas que fallan en `logic.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { buildUserText, criteriaFromFilters, estimateCostUsd, interpretResponse, isOverDailyLimit, kindFromPath, mapApiError, normalizeOutput, OUTPUT_SCHEMA, textPathFor } from './logic';

const MUST = ['Ventas en piso', 'Manejo de caja'];
const good = { readable: true, unreadableReason: '', person: { firstName: 'Ana', lastName: 'López', email: 'ana@mail.com', phone: '5555-1234' },
  parsed: { skills: ['ventas'], experience: [{ company: 'Max', role: 'Vendedora', years: 2 }], totalYears: 2, education: 'Diversificado' },
  score: { score: 101.6, matchPercent: -3, justification: 'ok', evidence: [{ criterion: 'Manejo de caja', matched: true, quote: 'caja' }, { criterion: 'Inventado', matched: true, quote: 'x' }], flags: [] } };

describe('normalizeOutput', () => {
  it('recorta y redondea puntajes', () => {
    const r = normalizeOutput(good, MUST); if (!r.ok) throw new Error();
    expect(r.score.score).toBe(100); expect(r.score.matchPercent).toBe(0);
  });
  it('una evidencia por imprescindible, en orden, sin inventadas', () => {
    const r = normalizeOutput(good, MUST); if (!r.ok) throw new Error();
    expect(r.score.evidence.map((e) => e.criterion)).toEqual(MUST);
    expect(r.score.evidence[0]).toEqual({ criterion: 'Ventas en piso', matched: false, quote: '— sin evidencia en el CV —' });
  });
  it('ilegible y no-CV son errores', () => {
    expect(normalizeOutput({ ...good, readable: false, unreadableReason: 'illegible' }, MUST)).toEqual({ ok: false, errorReason: 'illegible_pdf' });
    expect(normalizeOutput({ ...good, readable: false, unreadableReason: 'not_a_cv' }, MUST)).toEqual({ ok: false, errorReason: 'not_a_cv' });
  });
  it('basura → ai_error', () => { expect(normalizeOutput(null, MUST)).toEqual({ ok: false, errorReason: 'ai_error' }); });
});
describe('interpretResponse', () => {
  it('refusal → ai_refused; max_tokens → ai_error; JSON inválido → ai_error', () => {
    expect(interpretResponse({ stop_reason: 'refusal', content: [] }, MUST)).toEqual({ ok: false, errorReason: 'ai_refused' });
    expect(interpretResponse({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{' }] }, MUST)).toEqual({ ok: false, errorReason: 'ai_error' });
    expect(interpretResponse({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'no json' }] }, MUST)).toEqual({ ok: false, errorReason: 'ai_error' });
  });
  it('end_turn con JSON válido → ok', () => {
    const r = interpretResponse({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(good) }] }, MUST);
    expect(r.ok).toBe(true);
  });
});
describe('mapApiError', () => {
  it.each([[401, 'ai_not_configured'], [403, 'ai_not_configured'], [413, 'too_large'], [429, 'ai_error'], [500, 'ai_error'], [529, 'ai_error']])('%s → %s', (status, code) => {
    expect(mapApiError({ status })).toBe(code);
  });
  it('400 por PDF cifrado / dañado / otro', () => {
    expect(mapApiError({ status: 400, message: 'PDF is password protected' })).toBe('password_protected');
    expect(mapApiError({ status: 400, message: 'Could not process PDF' })).toBe('corrupt');
    expect(mapApiError({ status: 400, message: 'invalid request' })).toBe('ai_error');
  });
  it('sin status (red / timeout) → ai_error', () => { expect(mapApiError({ name: 'APIConnectionTimeoutError' })).toBe('ai_error'); });
});
describe('utilidades', () => {
  it('tope diario: 299 pasa, 300 no', () => { expect(isOverDailyLimit(299)).toBe(false); expect(isOverDailyLimit(300)).toBe(true); });
  it('kindFromPath', () => {
    expect(kindFromPath('t/c/cv.PDF')).toEqual({ kind: 'pdf', mediaType: 'application/pdf' });
    expect(kindFromPath('t/c/foto.jpeg')).toEqual({ kind: 'image', mediaType: 'image/jpeg' });
    expect(kindFromPath('t/c/cv.docx')).toEqual({ kind: 'text', mediaType: 'text/plain' });
    expect(kindFromPath('t/c/cv.doc')).toBeNull();
  });
  it('textPathFor', () => { expect(textPathFor('t1/c1/cv.docx')).toBe('t1/c1/texto.txt'); });
  it('costo: 10k entrada + 1k salida + 2k caché leída = 0.0302', () => {
    expect(estimateCostUsd({ input_tokens: 10000, output_tokens: 1000, cache_read_input_tokens: 2000 })).toBe(0.0302);
  });
  it('criteriaFromFilters separa por polaridad y tolera null', () => {
    expect(criteriaFromFilters('Asesor', [{ criterion: 'A', polarity: 'positive' }, { criterion: 'B', polarity: 'negative' }])).toEqual({ title: 'Asesor', mustHaves: ['A'], negatives: ['B'] });
    expect(criteriaFromFilters('X', null)).toEqual({ title: 'X', mustHaves: [], negatives: [] });
  });
  it('buildUserText menciona título, criterios y Word cuando es texto', () => {
    const t = buildUserText({ title: 'Asesor', mustHaves: ['A'], negatives: ['B'] }, 'text');
    expect(t).toContain('Asesor'); expect(t).toContain('A'); expect(t).toContain('B'); expect(t).toMatch(/Word/);
  });
  it('el esquema no admite propiedades extra', () => { expect(OUTPUT_SCHEMA).toMatchObject({ type: 'object', additionalProperties: false }); });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run supabase/functions/screen-cv/logic.test.ts`
Expected: FAIL (módulo `./logic` no existe).

- [ ] **Step 3: Implementar `logic.ts`**

Reglas que las pruebas no fijan: `normalizeOutput` recorta cadenas a 400 caracteres (`justification` a 600), limita `skills` a 30 y `flags` a 10, `years` y `totalYears` a `>= 0` redondeados a 1 decimal; si `person.firstName` y `lastName` vienen vacíos se devuelven vacíos (la app conserva el provisional). `mapApiError`: 400 con `/password|encrypt|protected/i` → `password_protected`; 400 con `/pdf|document|image|could not process|decode/i` → `corrupt`. `estimateCostUsd` usa los precios de Global Constraints.

- [ ] **Step 4: Correr las pruebas**

Run: `npx vitest run supabase/functions/screen-cv/logic.test.ts` → PASS. Run: `npm run lint` → sin errores (con el `include` nuevo de `tsconfig.json`).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/screen-cv/logic.ts supabase/functions/screen-cv/logic.test.ts tsconfig.json
git commit -m "feat(screen-cv): lógica pura de la función (prompt, esquema, normalización, errores, costo)"
```

---

### Task 3: Edge Function `screen-cv` (Deno) y despliegue

**Files:**
- Create: `supabase/functions/screen-cv/index.ts`
- Create: `supabase/functions/screen-cv/deno.json` (`{ "imports": { "@supabase/supabase-js": "jsr:@supabase/supabase-js@2", "@anthropic-ai/sdk": "npm:@anthropic-ai/sdk@1.7.0", "@std/encoding/base64": "jsr:@std/encoding@1/base64" } }`)

**Interfaces:**
- Consumes: todo lo de Task 2.
- Produces: endpoint `POST /functions/v1/screen-cv` con cuerpo `{ candidateId: string }` → `ScreenResult` en JSON (HTTP 200), `{ ok:false, errorReason:'not_found' }` con 400 si falta `candidateId`; `OPTIONS` → 200 con CORS (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`).

- [ ] **Step 1: Escribir `index.ts`**

Flujo exacto (una función `handle(req)` dentro de `Deno.serve`):
1. OPTIONS → 200 CORS.
2. Leer `candidateId`; si falta → 400.
3. `createClient(Deno.env.get('SUPABASE_URL'), clave publicable, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })`, donde clave publicable = `JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}').default ?? Deno.env.get('SUPABASE_ANON_KEY')`.
4. `candidates` → `select('id, tenant_id, job_id, cv_path').eq('id', candidateId).maybeSingle()`; sin fila o sin `cv_path` → `not_found`.
5. `jobs` → `select('title, filters').eq('id', job_id).maybeSingle()`; sin fila → `not_found`; `criteriaFromFilters`.
6. Tope diario: `ai_calls` → `select('id', { count: 'exact', head: true }).eq('tenant_id', …).gte('created_at', inicio del día UTC)`; `isOverDailyLimit(count ?? 0)` → `daily_limit` (sin registrar).
7. `ANTHROPIC_API_KEY` ausente → `ai_not_configured` (sin registrar).
8. `kindFromPath(cv_path)` nulo → `unsupported_format`; ruta a descargar = `textPathFor` si `kind === 'text'`, si no `cv_path`; `storage.from('cvs').download(ruta)`; error → `not_found`; `blob.size > MAX_FILE_BYTES` → `too_large`.
9. Contenido del mensaje: `pdf` → `{ type:'document', source:{ type:'base64', media_type:'application/pdf', data: encodeBase64(bytes) } }`; `image` → `{ type:'image', source:{ type:'base64', media_type, data } }`; `text` → `{ type:'text', text: 'CV (texto convertido de Word):\n' + texto }`; después siempre `{ type:'text', text: buildUserText(job, kind) }`.
10. `new Anthropic({ apiKey, timeout: 120_000, maxRetries: 1 }).messages.create({ model: MODEL, max_tokens: MAX_TOKENS, system: [{ type:'text', text: SYSTEM_PROMPT, cache_control: { type:'ephemeral' } }], messages: [{ role:'user', content }], output_config: { effort: EFFORT, format: { type:'json_schema', schema: OUTPUT_SCHEMA } } })`. En `catch`: `result = { ok:false, errorReason: mapApiError(err) }`, `usage` vacío. En éxito: `result = interpretResponse(response, mustHaves)`, `usage = response.usage`.
11. Insertar en `ai_calls` con el mismo cliente: `{ id: crypto.randomUUID(), tenant_id, candidate_id, kind:'screen_cv', model: MODEL, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd: estimateCostUsd(usage), ok: result.ok, error: result.ok ? null : result.errorReason }` (si falla el insert, se registra con `console.error` y se sigue).
12. Responder `result` con 200 y CORS. Cualquier excepción no prevista → `{ ok:false, errorReason:'ai_error' }` 200 + `console.error`.

- [ ] **Step 2: Comprobar tipos con Deno (si está disponible)**

Run: `npx -y deno@2 check supabase/functions/screen-cv/index.ts` (puede tardar la primera vez; si no hay red o falla la descarga, anotar y seguir).
Expected: sin errores de tipos.

- [ ] **Step 3: Desplegar**

Con la herramienta `deploy_edge_function`: `name: 'screen-cv'`, `verify_jwt: true`, `entrypoint_path: 'index.ts'`, `files: [index.ts, logic.ts, deno.json]` con el contenido exacto de los archivos; `import_map_path: 'deno.json'`.
Expected: función listada en `list_edge_functions` con estado ACTIVE.

- [ ] **Step 4: Verificar sin sesión**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS https://zdvcvazybuupalvjacnh.supabase.co/functions/v1/screen-cv
curl -s -w "\n%{http_code}\n" -X POST -H "content-type: application/json" -d '{"candidateId":"x"}' https://zdvcvazybuupalvjacnh.supabase.co/functions/v1/screen-cv
```
Expected: `200` para OPTIONS; `401` (sin JWT) para POST. La prueba con sesión se hace en Task 9.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/screen-cv/index.ts supabase/functions/screen-cv/deno.json
git commit -m "feat(screen-cv): Edge Function que lee el CV desde Storage y lo puntúa con Claude"
```

---

### Task 4: Tipos, catálogo de errores y parche de screening en la base

**Files:**
- Modify: `src/types/index.ts` (`Candidate`: `cvPath?: string;` después de `cvFileName`)
- Create: `src/core/screeningErrors.ts`
- Test: `src/core/screeningErrors.test.ts`
- Modify: `src/core/db/candidates.ts` (`CandidateRow.cv_path`, mapeos, `CandidatePatch`, `candidatePatchToRow`)
- Test: `src/core/db/candidates.test.ts`
- Modify: `src/context/CandidatesContext.tsx` (`updateCandidateFields`)

**Interfaces:**
- Produces:
  - `export const SCREENING_ERRORS: Record<ScreeningErrorCode, { label: string; retry: boolean }>` con las 12 etiquetas de la sección 10 del spec; `export type ScreeningErrorCode = …` (mismos 12 códigos que `ErrorCode` de Task 2); `export function screeningErrorLabel(code: string | undefined): string` (desconocido → `'Error de lectura'`); `export function canRetry(code: string | undefined): boolean` (desconocido → `false`).
  - `export type CandidatePatch = Partial<Pick<Candidate, 'stage'|'timeline'|'hiredAt'|'ownerId'|'screeningStatus'|'screeningScore'|'matchPercent'|'justification'|'evidence'|'flags'|'errorReason'|'parsed'|'firstName'|'lastName'|'email'|'phone'|'cvPath'>>`; `candidatePatchToRow` manda solo las claves presentes (`undefined` presente → `null`, salvo `stage`, `screeningStatus`, `firstName`, `lastName`, `email`, `phone` que nunca se mandan como null).
  - `CandidatesCtxValue.updateCandidateFields(candidateId: string, patch: CandidatePatch): void` — optimista; si falla el guardado restaura el candidato completo anterior y avisa con `notifyError(SAVE_ERROR)`; si el id no está en la lista, no hace nada.

- [ ] **Step 1: Pruebas que fallan**

`screeningErrors.test.ts`:
```ts
it('etiqueta y reintento', () => {
  expect(screeningErrorLabel('ai_not_configured')).toBe('La IA aún no está configurada; avísale a Oscar');
  expect(canRetry('ai_not_configured')).toBe(true); expect(canRetry('illegible_pdf')).toBe(false);
  expect(screeningErrorLabel('zzz')).toBe('Error de lectura'); expect(canRetry(undefined)).toBe(false);
  expect(Object.keys(SCREENING_ERRORS)).toHaveLength(12);
});
```
`candidates.test.ts` (añadir):
```ts
it('cv_path hace ida y vuelta', () => {
  const c = { ...CANDIDATES[0], cvPath: 't/c/cv.pdf' };
  expect(rowToCandidate(candidateToRow(c))).toEqual(c);
  expect(candidateToRow(CANDIDATES[0]).cv_path).toBeNull();
});
it('el parche de screening manda sus columnas', () => {
  expect(candidatePatchToRow({ screeningStatus: 'scored', screeningScore: 88, errorReason: undefined, firstName: 'Ana' }))
    .toEqual({ screening_status: 'scored', screening_score: 88, error_reason: null, first_name: 'Ana' });
});
```

- [ ] **Step 2: Correr y ver que fallan** — `npx vitest run src/core` → FAIL.

- [ ] **Step 3: Implementar** (`screeningErrors.ts`; `candidates.ts` con una tabla `PATCH_COLUMNS: Record<keyof CandidatePatch, keyof CandidateRow>` y un bucle; `CandidatesContext.updateCandidateFields` siguiendo el patrón de `change`).

- [ ] **Step 4: Correr** — `npx vitest run src/core` → PASS; `npm run lint` → OK.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/core/screeningErrors.ts src/core/screeningErrors.test.ts src/core/db/candidates.ts src/core/db/candidates.test.ts src/context/CandidatesContext.tsx
git commit -m "feat(candidatos): cv_path, catálogo de errores de screening y parche de resultado"
```

---

### Task 5: `runPool` (concurrencia limitada)

**Files:**
- Create: `src/lib/runPool.ts`
- Test: `src/lib/runPool.test.ts`

**Interfaces:**
- Produces: `export async function runPool<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>): Promise<void>` — nunca más de `limit` en vuelo; resuelve cuando todos terminan; un `worker` que lanza no detiene a los demás (el error se traga tras `console.error`).

- [ ] **Step 1: Prueba que falla**

```ts
it('no pasa de 3 en vuelo y termina todos', async () => {
  let inFlight = 0, max = 0; const done: number[] = [];
  await runPool([1,2,3,4,5,6,7], 3, async (n) => { inFlight++; max = Math.max(max, inFlight); await new Promise((r) => setTimeout(r, 5)); inFlight--; done.push(n); });
  expect(max).toBe(3); expect(done.sort()).toEqual([1,2,3,4,5,6,7]);
});
it('un fallo no detiene el lote', async () => {
  const done: number[] = [];
  await runPool([1,2,3], 2, async (n) => { if (n === 2) throw new Error('x'); done.push(n); });
  expect(done).toEqual([1,3]);
});
```

- [ ] **Step 2: Correr y ver que falla** — `npx vitest run src/lib/runPool.test.ts` → FAIL.
- [ ] **Step 3: Implementar `runPool`** (cola de índices compartida por `limit` trabajadores).
- [ ] **Step 4: Correr** → PASS.
- [ ] **Step 5: Commit** — `git add src/lib/runPool.ts src/lib/runPool.test.ts && git commit -m "feat(lib): runPool con concurrencia limitada"`

---

### Task 6: Adaptador real de screening, puerto, proveedores, Word y limpieza de Storage

**Files:**
- Modify: `package.json` (`npm i mammoth@^1.13.0`)
- Modify: `src/core/ports.ts` (puerto nuevo al final)
- Create: `src/core/adapters/supabaseScreening.ts`
- Test: `src/core/adapters/supabaseScreening.test.ts`
- Modify: `src/core/providers.ts`, `src/core/config.ts`
- Modify: `src/core/db/demo.ts` (`clearTenantCvs`)

**Interfaces:**
- Consumes: `ScreeningErrorCode` (Task 4); `supabase` (`core/supabase.ts`).
- Produces:
  - `ports.ts`: `export interface ScreenPerson { firstName: string; lastName: string; email: string; phone: string }`; `export type ScreenOutcome = { ok: true; person: ScreenPerson; parsed: ParsedCv; score: ScoreResult } | { ok: false; errorReason: ScreeningErrorCode }`; `export interface CvScreeningPort { screen(input: { file: File; candidateId: string; cvPath: string }): Promise<ScreenOutcome>; retry(candidateId: string): Promise<ScreenOutcome>; cvUrl(cvPath: string): Promise<string | null> }`.
  - `supabaseScreening.ts`: `export const MAX_FILE_MB = 10`; `export function validateFile(f: { name: string; size: number }): ScreeningErrorCode | null` (extensión en minúsculas: `pdf|jpg|jpeg|png|docx` ok; `doc` y otros → `unsupported_format`; `size > 10 MB` → `too_large`); `export function safeFileName(name: string): string` (NFD sin diacríticos, minúsculas, todo lo que no sea `a-z0-9._-` → `-`, sin guiones repetidos ni en los extremos, conserva la extensión, máximo 80 caracteres, vacío → `cv`); `export function cvPathFor(tenantId: string, candidateId: string, fileName: string): string`; `export function mimeFor(name: string): string`; `export function isDocx(name: string): boolean`; `export async function extractDocxText(file: Blob): Promise<string>` (mammoth `extractRawText({ arrayBuffer })`); `export const supabaseScreening: CvScreeningPort`.
  - `providers.ts`: `Providers.cvScreening: CvScreeningPort` = `supabaseScreening`; el `throw` de `DEMO_MODE=false` queda igual pero su mensaje dice que Screening ya es real.
  - `config.ts`: `export const AI_SCREENING_LABEL = 'Claude Sonnet 5.5';` y comentario de `DEMO_MODE` actualizado ("desde la Entrega B la lectura de CVs es real; lo demás sigue simulado").
  - `demo.ts`: `export async function clearTenantCvs(tenantId: string): Promise<void>` (lista `cvs/<tenantId>` carpeta por carpeta con `storage.from('cvs').list(prefix, { limit: 100, offset })` hasta vaciar y `remove(paths)` en lotes de 100); `resetDemo` la llama antes del `rpc`, y si falla sigue con el reset (`console.warn`).

- [ ] **Step 1: Pruebas que fallan (`supabaseScreening.test.ts`, solo funciones puras)**

```ts
it('validateFile', () => {
  expect(validateFile({ name: 'CV.PDF', size: 1000 })).toBeNull();
  expect(validateFile({ name: 'foto.JPG', size: 1000 })).toBeNull();
  expect(validateFile({ name: 'cv.docx', size: 1000 })).toBeNull();
  expect(validateFile({ name: 'cv.doc', size: 1000 })).toBe('unsupported_format');
  expect(validateFile({ name: 'cv.txt', size: 1000 })).toBe('unsupported_format');
  expect(validateFile({ name: 'cv.pdf', size: 10 * 1024 * 1024 + 1 })).toBe('too_large');
});
it('safeFileName y cvPathFor', () => {
  expect(safeFileName('Currículum José (final).PDF')).toBe('curriculum-jose-final.pdf');
  expect(safeFileName('')).toBe('cv');
  expect(cvPathFor('t_1', 'cand_9', 'Hoja de Vida.docx')).toBe('t_1/cand_9/hoja-de-vida.docx');
});
it('mimeFor e isDocx', () => {
  expect(mimeFor('a.PDF')).toBe('application/pdf'); expect(mimeFor('a.jpeg')).toBe('image/jpeg'); expect(mimeFor('a.png')).toBe('image/png');
  expect(mimeFor('a.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  expect(isDocx('a.DOCX')).toBe(true); expect(isDocx('a.pdf')).toBe(false);
});
```

- [ ] **Step 2: Correr y ver que fallan** — `npx vitest run src/core/adapters` → FAIL.

- [ ] **Step 3: Implementar**

`supabaseScreening.screen`: (1) `validateFile` → fallo inmediato; (2) `storage.from('cvs').upload(cvPath, file, { contentType: mimeFor(file.name), upsert: true })` → error → `upload_failed`; (3) si `isDocx`: `extractDocxText` (vacío o excepción → `corrupt`), `upload(textPath, new Blob([text], { type: 'text/plain' }), { contentType: 'text/plain', upsert: true })` → error → `upload_failed`, donde `textPath` = misma carpeta + `texto.txt`; (4) `invoke(candidateId)`. `retry` = `invoke`. `invoke`: `supabase.functions.invoke('screen-cv', { body: { candidateId } })`; `error` → `{ ok:false, errorReason:'ai_error' }`; `data` sin forma válida → `ai_error`; si no, `data`. `cvUrl`: `storage.from('cvs').createSignedUrl(cvPath, 60)` → `signedUrl` o `null`.

- [ ] **Step 4: Correr** — `npx vitest run src/core/adapters` → PASS; `npm run lint` → OK; `npm run build` → OK (mammoth se empaqueta).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/core/ports.ts src/core/adapters/supabaseScreening.ts src/core/adapters/supabaseScreening.test.ts src/core/providers.ts src/core/config.ts src/core/db/demo.ts
git commit -m "feat(screening): adaptador real (Storage + screen-cv), Word a texto y limpieza al restablecer"
```

---

### Task 7: Pantalla Screening con IA real, Reintentar y Ver CV; Candidatos con Ver CV

**Files:**
- Create: `src/features/screening/screeningResult.ts` + Test: `src/features/screening/screeningResult.test.ts`
- Create: `src/components/CvLink.tsx`
- Modify: `src/features/screening/ScreeningPage.tsx`
- Modify: `src/features/candidates/CandidatesPage.tsx:84-86` (junto al badge del puntaje)

**Interfaces:**
- Consumes: `providers.cvScreening` (Task 6), `updateCandidateFields` (Task 4), `runPool` (Task 5), `screeningErrorLabel`/`canRetry` (Task 4), `AI_SCREENING_LABEL`.
- Produces (`screeningResult.ts`, puro):
  - `export function makePendingCandidate(file: { name: string }, job: Job, candidateId: string, cvPath: string, today: string): Candidate` (`screeningStatus:'pending'`, `stage:'screening'`, nombre con `nameFromFile` movido aquí desde `ScreeningPage`, `email:''`, `phone:''`, `source:'Carga directa'`).
  - `export function outcomeToPatch(outcome: ScreenOutcome, provisional: { firstName: string; lastName: string }, today: string): CandidatePatch` — ok: `screeningStatus:'scored'`, `stage:'screening'`, nombre de la IA si ambos vienen no vacíos (si no, el provisional), `email`/`phone` de la IA, `screeningScore`, `matchPercent`, `justification`, `evidence`, `flags`, `parsed`, `errorReason: undefined`, `timeline: { screened: today }`; error: `screeningStatus:'error'`, `stage:'applied'`, `errorReason`.
  - `export function pendingState(c: Candidate, inFlight: ReadonlySet<string>): 'processing' | 'stale' | null` (`pending` + en vuelo → processing; `pending` sin estar en vuelo → stale; otro → null).
  - `CvLink({ cvPath }: { cvPath?: string })`: botón pequeño "Ver CV" (`lucide` `FileText`); al pulsar, `providers.cvScreening.cvUrl` y `window.open(url, '_blank', 'noopener')`; si `null`, `notifyError('No se pudo abrir el CV. Inténtalo de nuevo.')`; sin `cvPath` no renderiza nada.

- [ ] **Step 1: Pruebas que fallan (`screeningResult.test.ts`)**

```ts
const job = JOBS[0]; // de data/seed
it('pendiente provisional', () => {
  const c = makePendingCandidate({ name: 'Maria_Gonzalez_CV.pdf' }, job, 'cand_x', 't/cand_x/maria_gonzalez_cv.pdf', '2026-11-10');
  expect(c).toMatchObject({ id: 'cand_x', firstName: 'Maria', lastName: 'Gonzalez', screeningStatus: 'pending', stage: 'screening', email: '', phone: '', cvPath: 't/cand_x/maria_gonzalez_cv.pdf' });
});
it('resultado ok → scored con nombre de la IA', () => {
  const p = outcomeToPatch({ ok: true, person: { firstName: 'María', lastName: 'González', email: 'm@x.com', phone: '5' }, parsed: PARSED, score: SCORE }, { firstName: 'Maria', lastName: 'Gonzalez' }, '2026-11-10');
  expect(p).toMatchObject({ screeningStatus: 'scored', stage: 'screening', firstName: 'María', email: 'm@x.com', timeline: { screened: '2026-11-10' } });
  expect('errorReason' in p && p.errorReason === undefined).toBe(true);
});
it('sin nombre de la IA conserva el provisional', () => {
  const p = outcomeToPatch({ ok: true, person: { firstName: '', lastName: '', email: '', phone: '' }, parsed: PARSED, score: SCORE }, { firstName: 'Maria', lastName: 'Gonzalez' }, '2026-11-10');
  expect(p.firstName).toBe('Maria');
});
it('error → applied con código', () => {
  expect(outcomeToPatch({ ok: false, errorReason: 'ai_not_configured' }, { firstName: 'a', lastName: 'b' }, 'd')).toEqual({ screeningStatus: 'error', stage: 'applied', errorReason: 'ai_not_configured' });
});
it('pendingState', () => {
  const c = { ...CANDIDATES[0], screeningStatus: 'pending' as const };
  expect(pendingState(c, new Set([c.id]))).toBe('processing'); expect(pendingState(c, new Set())).toBe('stale');
  expect(pendingState({ ...c, screeningStatus: 'scored' }, new Set())).toBeNull();
});
```

- [ ] **Step 2: Correr y ver que fallan** — `npx vitest run src/features/screening` → FAIL.

- [ ] **Step 3: Implementar `screeningResult.ts` y `CvLink.tsx`; correr** → PASS.

- [ ] **Step 4: Reescribir el flujo de `ScreeningPage.tsx`**

- `processFiles(files: File[])`: por archivo (vía `runPool(files, 3, …)`): `id = newId('cand')`, `cvPath = cvPathFor(tenant.id, id, file.name)`, `addCandidate(makePendingCandidate(…))`, marcar en `inFlight` (estado `Set<string>`), `outcome = await providers.cvScreening.screen({ file, candidateId: id, cvPath })`, quitar de `inFlight`, `updateCandidateFields(id, outcomeToPatch(outcome, provisional, todayISO()))`, avanzar `batch.done`. El guard `runRef` solo evita tocar `batch`/`tab` de un lote viejo; el resultado se aplica igual (si el candidato ya no está en la lista, `updateCandidateFields` no hace nada).
- `handleFiles` pasa `Array.from(files)` (objetos `File`), ya no nombres.
- `retry(c)`: `updateCandidateFields(c.id, { screeningStatus:'pending', errorReason: undefined, stage:'screening' })`, `inFlight` + `providers.cvScreening.retry(c.id)` + `outcomeToPatch`.
- Pestaña "Rankeados": primero las filas `pending` (`PendingRow`: spinner "Leyendo el CV…" si `processing`; "Quedó pendiente" + botón Reintentar si `stale`), luego `ranked`. Pestaña "Cola de errores": `ErrorRow` muestra `screeningErrorLabel(c.errorReason)`, botón **Reintentar** si `canRetry`, y `<CvLink cvPath={c.cvPath} />`; se elimina "Subir versión legible" y el mapa `ERROR_LABELS`.
- `CandidateRow`: `<CvLink cvPath={candidate.cvPath} />` junto al puntaje.
- Aviso superior (variante `brand`): `Los CVs los lee y puntúa ${AI_SCREENING_LABEL}; el archivo original queda guardado para el equipo. "CVs de ejemplo" sigue simulado y no cuesta nada.`
- Botón de ejemplo: texto "CVs de ejemplo (simulados)"; `loadSamples` conserva el mock (`providers.cvParser` + `providers.llm.scoreCandidate` + `makeScoredCandidate`, con `source: 'Ejemplo simulado'`).
- Zona de carga: `accept=".pdf,.docx,.png,.jpg,.jpeg"` y texto "PDF, Word (.docx) o imágenes · máximo 10 MB · carga por lote".

- [ ] **Step 5: `CandidatesPage.tsx`**: después del badge del puntaje, `<CvLink cvPath={c.cvPath} />`.

- [ ] **Step 6: Verificar** — `npm run lint`, `npm test`, `npm run build` → OK. Abrir `npm run dev` (preview `talentia` en `.claude/launch.json`, crearlo si falta: `{"name":"talentia","runtimeExecutable":"npm","runtimeArgs":["run","dev"],"port":3000}`), iniciar sesión, en Screening soltar un PDF pequeño: aparece "Leyendo el CV…", luego cae a la cola de errores con "La IA aún no está configurada; avísale a Oscar" y Reintentar; "Ver CV" abre el archivo; consola sin errores.

- [ ] **Step 7: Commit**

```bash
git add src/features/screening src/components/CvLink.tsx src/features/candidates/CandidatesPage.tsx .claude/launch.json
git commit -m "feat(screening): lectura real con estado Procesando, Reintentar y Ver CV"
```

---

### Task 8: Textos de ayuda, FAQ y casos del chat

**Files:**
- Modify: `src/data/helpFaq.ts` (entradas `subir-cv`, `errores-cv`, `demo`; entrada nueva `ia-cv`)
- Modify: `scripts/help-chat-cases.mjs` (casos nuevos)
- Modify: `src/components/layout/Sidebar.tsx:133-134`, `src/features/help/PilotGuidePage.tsx:85`
- Modify: `src/features/help/tourSteps.ts` (paso de Screening, si menciona simulación)

**Interfaces:** ninguna nueva.

- [ ] **Step 1: Agregar casos al banco (fallan antes de la FAQ)**

```js
// --- Entrega B: IA real para CVs ---
['¿la IA lee el CV de verdad?', 'ia-cv', '/screening'],
['¿qué formatos de CV acepta?', 'ia-cv', '/screening'],
['¿puedo subir un cv en word?', 'ia-cv', '/screening'],
['¿dónde queda guardado el archivo del cv?', 'ia-cv', '/screening'],
['¿cómo veo el cv original?', 'ia-cv', '/candidatos'],
['dice que la ia no está configurada', 'errores-cv', '/screening'],
['¿cómo reintento un cv con error?', 'errores-cv', '/screening'],
['¿cuánto cuesta cada cv?', 'ia-cv', '/'],
```

- [ ] **Step 2: Correr** — `npm run check:help` → FAIL en los casos nuevos.

- [ ] **Step 3: Escribir los textos**

- `ia-cv`: pregunta "¿Qué hace la IA con cada CV?"; palabras clave: `ia`, `inteligencia artificial`, `claude`, `lee`, `leer`, `lectura`, `formato`, `formatos`, `word`, `docx`, `pdf`, `imagen`, `foto`, `archivo`, `guardado`, `original`, `ver cv`, `costo`, `cuesta`, `privado`; respuesta: Claude lee el archivo completo (PDF, foto o Word convertido a texto), saca nombre, correo, teléfono, experiencia y educación, puntúa contra los filtros de la vacante citando frases del CV, el original queda guardado de forma privada para la empresa y se abre con "Ver CV"; cuesta centavos por CV y hay un tope diario; `route: '/screening'`.
- `errores-cv`: agregar los motivos nuevos (Word antiguo, muy grande, no parece un CV, IA no configurada → avisar a Oscar, límite diario) y que "Reintentar" usa el archivo ya guardado.
- `subir-cv`: formatos PDF, Word (.docx), JPG/PNG, máximo 10 MB; el candidato aparece "Leyendo el CV…" y se completa solo.
- `demo`: "los datos son de ejemplo; la lectura de CVs ya es real (Claude); las entrevistas por IA, el chat de ayuda y los mensajes a candidatos siguen simulados".
- Sidebar: título "Modo demostración", línea "Screening con IA real · entrevistas y ayuda simuladas".
- PilotGuidePage regla 1: "Los CVs los lee de verdad la IA (Claude). Las entrevistas por IA, el chat de ayuda y los mensajes a candidatos siguen simulados: no se envía nada real a nadie."

- [ ] **Step 4: Correr** — `npm run check:help` → todos los casos pasan (ajustar palabras clave si uno existente se desvía); `npm run lint` → OK.

- [ ] **Step 5: Commit**

```bash
git add src/data/helpFaq.ts scripts/help-chat-cases.mjs src/components/layout/Sidebar.tsx src/features/help/PilotGuidePage.tsx src/features/help/tourSteps.ts
git commit -m "docs(ayuda): la lectura de CVs ya es real; FAQ de formatos, archivo guardado y errores"
```

---

### Task 9: Verificación integral, ESTADO.md y PR

**Files:**
- Modify: `ESTADO.md` (bloque de retoma: Entrega B hecha, pasos de Oscar, pendientes)
- Modify: `supabase/README.md` (si Task 1 dejó algo fuera)

- [ ] **Step 1: Calidad completa**

Run: `npm test && npm run lint && npm run build && npm run check:help` → todo en verde.

- [ ] **Step 2: Verificación en navegador con sesión (cuenta de Oscar en el panel del navegador)**

1. Screening: soltar `docs/…/un PDF de prueba` → "Leyendo el CV…" → cola de errores "La IA aún no está configurada; avísale a Oscar" + Reintentar; el objeto existe en Storage (`execute_sql`: `select name from storage.objects where bucket_id='cvs'`); fila nueva **no** existe en `ai_calls` (la función no registra `ai_not_configured`).
2. Soltar un `.docx` → también `texto.txt` en Storage.
3. "Ver CV" abre el archivo en pestaña nueva (URL firmada).
4. "CVs de ejemplo (simulados)" sigue creando 4 candidatos sin tocar Storage.
5. Candidatos: tarjeta con "Ver CV".
6. Configuración → Restablecer la demo → `storage.objects` del tenant queda vacío.
7. Celular (375 px): Screening sin scroll horizontal; consola sin errores.

- [ ] **Step 3: ESTADO.md**

Bloque nuevo al inicio: qué cambió para el equipo; que sin la clave los CVs caen con "IA aún no configurada"; pasos de Oscar (cuenta Anthropic + saldo + clave → secreto `ANTHROPIC_API_KEY` en Supabase → avisar para la prueba real; apagar registro público; cuentas de Reynaldo y Jessica); pendientes menores (videos no regrabados; Admin no lee `ai_calls`; `.doc` antiguo). Marcar el paso 8 del roadmap y añadir "Entrega C".

- [ ] **Step 4: Commit y PR**

```bash
git add ESTADO.md supabase/README.md
git commit -m "docs: ESTADO.md — Entrega B (IA real para CVs)"
git push -u origin ia-real-cvs
gh pr create --title "feat: IA real para CVs (Entrega B)" --body "..."
```
Expected: PR abierto; CI (si la hay) en verde. El merge lo decide Oscar (publica en Pages).
