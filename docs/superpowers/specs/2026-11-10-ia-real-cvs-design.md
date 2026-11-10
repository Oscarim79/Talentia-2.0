# Entrega B — IA real para la lectura y el puntaje de CVs

Fecha: 2026-11-10. Aprobado por Oscar en conversación (diseño) el 2026-11-10.
Antecedente: `2026-11-09-persistencia-supabase-login-design.md` (Entrega A), sección 14.

## 1. Problema

Desde la Entrega A los CVs cargados se guardan para todo el equipo, pero la "lectura" y el
"puntaje" siguen simulados: el nombre sale del nombre del archivo y las habilidades, los años y el
puntaje se inventan de forma determinista (`core/adapters/mock.ts`). Con CVs reales los resultados
no sirven y destruyen la confianza del equipo de RR.HH. El archivo tampoco se conserva: solo el
nombre.

## 2. Objetivo y criterios de éxito

Que al soltar un CV real (PDF, imagen o Word) en Screening IA:

1. El archivo original quede guardado de forma privada para la empresa.
2. Claude lo lea de verdad y devuelva: nombre, correo y teléfono; habilidades, experiencia, años y
   educación; puntaje 0–100, porcentaje de coincidencia, justificación, evidencia **con citas
   textuales del CV** por cada criterio de la vacante, y alertas por criterios excluyentes.
3. El candidato aparezca de inmediato como "Procesando…" y se complete solo; el resto de la app
   (Respuestas a CVs, Candidatos, Entrevistas, Métricas) lo vea igual que antes.
4. Los fallos (ilegible, protegido, no es un CV, muy grande, IA sin configurar, tope diario)
   caigan en la cola de errores con un motivo claro y un botón **Reintentar** que no vuelve a subir
   el archivo.
5. La clave de Anthropic nunca esté en el código, en GitHub ni en el navegador.
6. Cada lectura quede registrada (modelo, tokens, costo estimado, éxito/fallo) para controlar el gasto.
7. `npm test`, `npm run lint`, `npm run build` y `npm run check:help` pasen.

## 3. Decisiones tomadas (con Oscar, 2026-11-10)

| Decisión | Elegido | Motivo |
|---|---|---|
| Modelo | **Claude Sonnet 5.5** (`claude-sonnet-5-5`), esfuerzo `medium` | Precisión muy buena a la mitad del costo de Opus: ≈ 1–3 ¢ de dólar por CV. El esfuerzo es una constante en la función; `low` queda como palanca de ahorro si los resultados se mantienen. |
| Archivos de Word | `.docx` se convierte a texto **en el navegador** (librería `mammoth`); `.doc` antiguo va a la cola de errores ("conviértelo a PDF") | Claude lee PDF e imágenes, no Word. |
| Botón "CVs de ejemplo" | Sigue **simulado y gratis**, con la etiqueta "ejemplo simulado" | Demo rápida sin costo. |
| Cuenta de Anthropic | Oscar aún no la tiene | Se construye y despliega todo; la prueba con CVs reales queda para cuando exista la clave (sección 12). Sin clave la app muestra "La IA aún no está configurada" en la cola de errores. |
| Dónde vive el archivo | **Storage privado** de Supabase (bucket `cvs`) | Conservar el CV permite Reintentar y "Ver CV". Decisión previa (spec A, sección 14). |
| Quién escribe en la base | **La app** escribe el candidato (pendiente → resultado); la función solo registra el consumo | Un solo escritor por tabla; la función devuelve el resultado y no toca `candidates`. |
| Reintentos con otro modelo | No | Si el modelo se niega a leer un documento (raro), cae a la cola de errores. Simplicidad. |
| Videos de ayuda | No se regraban | Queda anotado en ESTADO.md. |

## 4. Lo que NO incluye esta entrega

- IA real para Entrevistas IA, el chat de ayuda, la descripción de vacantes, las preguntas de
  entrevista y el plan de crecimiento (siguen con `mock.ts`).
- Consola Admin leyendo el consumo real (la tabla queda lista; la pantalla sigue con el seed).
- Volver a puntuar un candidato con otra vacante.
- Procesamiento en segundo plano (la pestaña debe seguir abierta durante el lote).
- Conversión de `.doc` antiguo.

## 5. Arquitectura

```
Navegador (React, sesión de Supabase)
  1. valida archivo (tipo, ≤ 10 MB) → candidato "pending" en Supabase
  2. sube el original a Storage: cvs/<tenant_id>/<candidate_id>/<archivo>
     (.docx: además extrae el texto con mammoth y sube cvs/<tenant_id>/<candidate_id>/texto.txt)
  3. llama a la Edge Function screen-cv { candidateId }   (JWT del usuario)
  4. con la respuesta actualiza el candidato (scored / error)
         │
         ▼
Edge Function screen-cv (Deno, en Supabase; única que conoce ANTHROPIC_API_KEY)
  a. cliente de Supabase con el JWT del usuario (RLS manda)
  b. lee candidates + jobs → tenant, ruta del CV, criterios de la vacante
  c. tope diario: cuenta ai_calls de la empresa hoy (≥ 300 → daily_limit)
  d. descarga el archivo (PDF / imagen / texto) desde Storage
  e. Claude Sonnet 5.5, salida JSON con esquema fijo
  f. inserta ai_calls (tokens, costo estimado, ok/error)
  g. responde { ok, person, parsed, score } o { ok:false, errorReason }
```

Tres CVs se procesan a la vez (`runPool`, concurrencia 3) para que un lote de 30 no tarde media hora.

## 6. Modelo de datos (migración `0006_ia_cvs.sql`)

### Storage

- Bucket **`cvs`**, privado, límite 10 MB, tipos permitidos: `application/pdf`, `image/jpeg`,
  `image/png`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`.
- Ruta: `<tenant_id>/<candidate_id>/<nombre-seguro>`; para `.docx` además `<tenant_id>/<candidate_id>/texto.txt`.
- Políticas sobre `storage.objects` (select/insert/update/delete para `authenticated`):
  `bucket_id = 'cvs' and (storage.foldername(name))[1] in (select public.my_tenant_ids())`.

### Tabla `candidates`

- Columna nueva `cv_path text` (ruta en Storage del original; null en el seed y en los ejemplos simulados).

### Tabla nueva `ai_calls` (registro de consumo)

| Columna | Tipo | Nota |
|---|---|---|
| id | text pk | uuid generado en la función |
| tenant_id | text not null → tenants | |
| candidate_id | text null → candidates on delete set null | |
| kind | text | `screen_cv` |
| model | text | `claude-sonnet-5-5` |
| input_tokens, output_tokens, cache_read_tokens, cache_write_tokens | int | de `usage` |
| cost_usd | numeric(10,6) | estimado con precios fijos en la función |
| ok | boolean | |
| error | text null | código de error |
| created_at | timestamptz default now() | |

RLS: select e insert para miembros de la empresa (`tenant_id in my_tenant_ids()`); sin update ni
delete; nada para `anon`. `reset_demo` **no** borra `ai_calls` (es historial de gasto); al borrar
candidatos, `candidate_id` queda en null.

### Limpieza al restablecer la demo

Antes de llamar a `reset_demo`, la app borra los archivos de `cvs/<tenant_id>/` (lista paginada +
`remove`); si falla, avisa pero sigue con el reset (los archivos huérfanos no rompen nada).

## 7. Edge Function `screen-cv`

- Carpeta `supabase/functions/screen-cv/`: `index.ts` (Deno: HTTP, Supabase, Anthropic) y
  `logic.ts` (puro, sin Deno: prompt, esquema JSON, normalización, mapeo de errores, costo) con
  `logic.test.ts` (vitest).
- `verify_jwt: true`. CORS abierto (OPTIONS) para localhost y GitHub Pages.
- Entrada: `{ candidateId: string }`. Todo lo demás se lee de la base con el JWT del usuario: si
  el candidato no es de una empresa suya, RLS no devuelve nada → `not_found`.
- Secreto: `ANTHROPIC_API_KEY` (Supabase → Edge Functions → Secrets). Si falta → `ai_not_configured`
  sin llamar a Anthropic.
- Variables inyectadas por Supabase: `SUPABASE_URL` y la clave publicable
  (`SUPABASE_PUBLISHABLE_KEYS` → `default`, o `SUPABASE_ANON_KEY` si no existe).
- Llamada a Claude (SDK oficial `@anthropic-ai/sdk` vía `npm:`), no streaming, `max_tokens` 4096,
  `timeout` 120 s, `maxRetries` 1 (la función debe responder antes de los 150 s del plan gratis):
  - `system` (bloque cacheado): reclutador experto de retail en Guatemala; extrae y evalúa; **la
    evidencia es cita textual del CV**, nunca inventada; si no es un CV o es ilegible, `readable:false`
    con motivo; responde en español; rúbrica de puntaje (cobertura de imprescindibles, experiencia
    relevante y años, criterios excluyentes → alertas y penalización; `matchPercent` = coincidencia
    semántica global).
  - `user`: criterios de la vacante (título, imprescindibles, excluyentes) + el CV como bloque
    `document` (PDF base64) / `image` (JPG/PNG base64) / texto plano (Word convertido).
  - `output_config.format = { type: 'json_schema', schema }` con el esquema de `logic.ts`:
    `{ readable, unreadableReason, person{firstName,lastName,email,phone}, parsed{skills[],
    experience[{company,role,years}],totalYears,education}, score{score,matchPercent,justification,
    evidence[{criterion,matched,quote}],flags[]} }`.
  - `output_config.effort = 'medium'`; `thinking` omitido (adaptativo por defecto).
- Respuesta: `stop_reason === 'refusal'` → `ai_refused`; `max_tokens` → `ai_error`; JSON inválido →
  `ai_error`. `logic.normalize()` recorta puntajes a 0–100, exige una entrada de evidencia por
  criterio imprescindible (completa las que falten con `matched:false`) y limpia textos.
- Errores de la API: 401 → `ai_not_configured`; 400 por documento (PDF cifrado/corrupto) →
  `password_protected` o `corrupt` según el mensaje; 413 o archivo > 10 MB → `too_large`; 429/5xx/
  tiempo agotado → `ai_error` (reintentable).
- Costo estimado (precios fijos en `logic.ts`): entrada US$2/M, salida US$10/M, lectura de caché
  US$0.10/M, escritura de caché US$2.50/M.

## 8. Cambios en la app, por archivo

| Archivo | Cambio |
|---|---|
| `src/types/index.ts` | `Candidate.cvPath?: string`. |
| `src/core/screeningErrors.ts` (nuevo) | Códigos de error, etiqueta en español y si admite Reintentar. |
| `src/core/ports.ts` | Puerto nuevo `CvScreeningPort { screen(input): Promise<ScreenOutcome> }` (sube + convierte + llama; también `retry(candidateId)`). Los puertos `cvParser`/`llm.scoreCandidate` se conservan para el botón de ejemplo. |
| `src/core/adapters/supabaseScreening.ts` (nuevo) | Adaptador real: validación, `mammoth` para `.docx`, subida a Storage, `functions.invoke('screen-cv')`, mapeo de errores; `signedCvUrl(path)` para "Ver CV". |
| `src/core/adapters/mock.ts` | Sin cambios de comportamiento; comentario aclarando qué sigue simulado. |
| `src/core/providers.ts` | `cvScreening: supabaseScreening` siempre (requiere Supabase, como todo); el resto sigue mock. Mensaje del `throw` actualizado. |
| `src/core/config.ts` | Comentario de `DEMO_MODE` actualizado; `AI_SCREENING_LABEL = 'Claude Sonnet 5.5'`. |
| `src/core/db/candidates.ts` | `cv_path`; `CandidatePatch` acepta los campos de screening (`screeningStatus`, `screeningScore`, `matchPercent`, `justification`, `evidence`, `flags`, `errorReason`, `parsed`, `firstName`, `lastName`, `email`, `phone`, `cvPath`, `stage`, `timeline`). |
| `src/core/db/demo.ts` | `clearTenantCvs(tenantId)` antes de `reset_demo`. |
| `src/context/CandidatesContext.tsx` | `updateCandidateFields(id, patch)` (optimista, con reversión y aviso si falla). |
| `src/lib/runPool.ts` (nuevo) | Ejecuta tareas con concurrencia limitada (3). |
| `src/features/screening/ScreeningPage.tsx` | `processFiles(File[])`: pendiente → subir → función → resultado; filas "Procesando…" con spinner; cola de errores con etiqueta por código y **Reintentar**; se elimina "Subir versión legible"; **Ver CV**; aviso: "Los CVs los lee y puntúa Claude Sonnet 5.5…"; botón "CVs de ejemplo (simulados)" sigue con el mock. |
| `src/features/candidates/CandidatesPage.tsx` | Enlace **Ver CV** cuando `cvPath` existe. |
| `src/components/layout/Sidebar.tsx`, `src/features/help/PilotGuidePage.tsx`, `src/data/helpFaq.ts` | Textos: Screening con IA real; el resto simulado. FAQ nueva: qué hace la IA con el CV / por qué cayó en la cola de errores / qué formatos acepta / qué pasa con el archivo. Casos nuevos en `scripts/help-chat-cases.mjs`. |
| `package.json` | dependencia `mammoth`. |
| `tsconfig.json` | incluye `supabase/functions/**/logic.ts` y sus pruebas (no `index.ts`, que es Deno). |
| `supabase/migrations/0006_ia_cvs.sql`, `supabase/README.md` | Migración y guía (secreto, despliegue de la función, límites). |
| `ESTADO.md` | Cierre de la entrega y pasos de Oscar. |

Flujo de estado del candidato creado en vivo: `pending` (stage `screening`, nombre provisional
del archivo, correo y teléfono vacíos) → `scored` (nombre/correo/teléfono reales si la IA los
encontró; si no, se conserva el provisional; `timeline.screened = hoy`) o `error` (stage
`applied`, `errorReason` = código). Reintentar vuelve a poner `pending` y llama a la función
con el mismo `candidateId`.

## 9. Configuración, despliegue y mantenimiento

- Migración 0006 con la herramienta `apply_migration` (o SQL Editor), después de 0005.
- Función desplegada con la herramienta `deploy_edge_function` (o `supabase functions deploy
  screen-cv` con la CLI). El código fuente vive en el repo; se vuelve a desplegar con cada cambio.
- Secreto `ANTHROPIC_API_KEY`: solo Oscar, en el panel de Supabase. Nunca en el chat ni en `.env`.
- GitHub Pages: sin variables nuevas (la URL de la función sale de `VITE_SUPABASE_URL`).
- Tope diario (`DAILY_LIMIT = 300` por empresa) y tamaño máximo (`MAX_FILE_MB = 10`) son constantes
  en `logic.ts` / `supabaseScreening.ts`.

## 10. Manejo de errores (lo que ve RR.HH.)

| Código | Etiqueta | Reintentar |
|---|---|---|
| `unsupported_format` | Formato no admitido: PDF, JPG, PNG o Word (.docx) | no |
| `too_large` | El archivo pasa de 10 MB | no |
| `upload_failed` | No se pudo guardar el archivo; revisa tu conexión | sí |
| `illegible_pdf` | Ilegible (escaneo borroso o foto) | no |
| `not_a_cv` | El documento no parece un CV | no |
| `password_protected` | PDF protegido con contraseña | no |
| `corrupt` | Archivo dañado | no |
| `ai_not_configured` | La IA aún no está configurada; avísale a Oscar | sí |
| `ai_refused` | La IA no pudo procesar este documento | no |
| `ai_error` | La IA no respondió; inténtalo de nuevo en un momento | sí |
| `daily_limit` | Se alcanzó el límite diario de lecturas de la empresa | sí (mañana) |
| `not_found` | El candidato ya no existe | no |

Con la función caída o sin red: `ai_error`. Si se cierra la pestaña a media carga, los
candidatos quedan en `pending`; al volver, Screening los muestra con Reintentar.

## 11. Pruebas y verificación

- Unitarias (vitest): `logic.test.ts` (prompt con criterios, esquema, normalización, mapeo de
  errores de la API, costo), `screeningErrors.test.ts`, `runPool.test.ts`,
  `candidates.test.ts` (parche de screening ↔ fila), `supabaseScreening.test.ts` (validación de
  tipo/tamaño y nombre de ruta seguro).
- `npm run lint`, `npm run build`, `npm run check:help` (con los casos nuevos).
- Despliegue real de la función y la migración en el proyecto `zdvcvazybuupalvjacnh`.
- En navegador (local, cuenta de Oscar): subir un PDF → candidato "Procesando…" → sin clave cae en
  la cola de errores con "La IA aún no está configurada" y Reintentar; el archivo aparece en
  Storage bajo la carpeta de la empresa; "Ver CV" abre el archivo; "CVs de ejemplo" sigue igual;
  Restablecer la demo deja la carpeta vacía; celular sin scroll horizontal; sin errores de consola.
- Con la clave (cuando Oscar la tenga): un PDF real → nombre, correo y teléfono correctos,
  evidencia con citas, fila en `ai_calls` con tokens y costo; un escaneo borroso → `illegible_pdf`;
  un `.docx` → texto convertido y puntuado.

## 12. Pasos que solo Oscar puede hacer

1. Crear la cuenta en console.anthropic.com, cargar saldo (desde US$5) y crear una clave API.
2. Guardarla en Supabase: proyecto TalentIA 2.0 → **Edge Functions → Secrets** → Add new secret →
   nombre `ANTHROPIC_API_KEY`, valor la clave → Save. Avisar a Claude para hacer la prueba real.
3. Pendientes de la Entrega A: apagar el registro público (Authentication → Sign In / Providers →
   Email → "Allow new users to sign up" OFF) y crear las cuentas de Reynaldo y Jessica.

## 13. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Gasto fuera de control | Solo usuarios con sesión; tope diario por empresa; registro en `ai_calls`; saldo prepagado en Anthropic. |
| La función tarda más de 150 s (plan gratis) | `timeout` 120 s y 1 reintento; archivo ≤ 10 MB; salida ≤ 4096 tokens. |
| CPU de la función > 2 s | Solo codifica base64 y arma JSON; la espera de red no cuenta. |
| Nombre o correo mal leídos | RR.HH. ve el CV original con "Ver CV"; el provisional del archivo se conserva si la IA no encuentra nombre. |
| Archivos huérfanos en Storage | Limpieza al restablecer la demo; 1 GB gratis alcanza para miles de CVs. |
| La API de Anthropic cambia | SDK oficial fijado por versión en `index.ts`; errores mapeados a `ai_error` reintentable. |

## 14. Siguiente entrega (fuera de este alcance)

Entrevistas IA, chat de ayuda y planes de crecimiento con Claude real; consola Admin con el
consumo de `ai_calls`; cuentas de Reynaldo y Jessica y piloto con una vacante real.
