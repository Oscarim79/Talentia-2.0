// ============================================================
//  Edge Function `screen-cv` (Deno, Supabase).
//  Lee un CV guardado en Storage y lo puntúa con Claude. Es la única
//  pieza que conoce ANTHROPIC_API_KEY (secreto de Supabase).
//
//  Entrada:  POST { candidateId }  con el JWT del usuario (verify_jwt).
//  Salida:   200 { ok:true, person, parsed, score }
//            200 { ok:false, errorReason }   (errores de negocio)
//            400 si falta candidateId.
//  Todo lo demás (empresa, vacante, ruta del archivo) se lee de la base
//  con el JWT del usuario: RLS decide qué puede ver. La función NO escribe
//  en `candidates`; solo registra el consumo en `ai_calls`.
// ============================================================
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import {
  EFFORT,
  MAX_FILE_BYTES,
  MAX_TOKENS,
  MODEL,
  OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  buildUserText,
  criteriaFromFilters,
  estimateCostUsd,
  interpretResponse,
  isOverDailyLimit,
  kindFromPath,
  mapApiError,
  textPathFor,
  type ErrorCode,
  type ScreenResult,
} from './logic.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function fail(errorReason: ErrorCode): Response {
  return json({ ok: false, errorReason });
}

/** Base64 de un archivo, por trozos (evita desbordar la pila con archivos grandes). */
function encodeBase64(bytes: Uint8Array): string {
  let bin = '';
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/** Clave publicable que Supabase inyecta (nueva o legada). */
function publishableKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}');
    if (typeof keys?.default === 'string' && keys.default) return keys.default;
  } catch {
    // sin claves nuevas: se usa la legada
  }
  return Deno.env.get('SUPABASE_ANON_KEY') ?? '';
}

type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};
const NO_USAGE: Usage = { input_tokens: 0, output_tokens: 0 };

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, errorReason: 'not_found' }, 405);

  const body = await req.json().catch(() => null);
  const candidateId = body && typeof body.candidateId === 'string' ? body.candidateId : '';
  if (!candidateId) return json({ ok: false, errorReason: 'not_found' }, 400);

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', publishableKey(), {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  // Candidato y vacante (RLS: solo si pertenecen a una empresa del usuario)
  const { data: cand } = await supabase
    .from('candidates')
    .select('id, tenant_id, job_id, cv_path')
    .eq('id', candidateId)
    .maybeSingle();
  if (!cand || !cand.cv_path) return fail('not_found');

  const { data: job } = await supabase.from('jobs').select('title, filters').eq('id', cand.job_id).maybeSingle();
  if (!job) return fail('not_found');
  const criteria = criteriaFromFilters(job.title ?? '', job.filters);

  // Tope diario por empresa
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_calls')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', cand.tenant_id)
    .gte('created_at', since.toISOString());
  if (isOverDailyLimit(count ?? 0)) return fail('daily_limit');

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return fail('ai_not_configured');

  // Archivo desde Storage
  const kind = kindFromPath(cand.cv_path);
  if (!kind) return fail('unsupported_format');
  const path = kind.kind === 'text' ? textPathFor(cand.cv_path) : cand.cv_path;
  const { data: blob, error: dlError } = await supabase.storage.from('cvs').download(path);
  if (dlError || !blob) return fail('not_found');
  if (blob.size > MAX_FILE_BYTES) return fail('too_large');

  const content: Anthropic.ContentBlockParam[] = [];
  if (kind.kind === 'text') {
    content.push({ type: 'text', text: `CV (texto convertido de Word):\n${await blob.text()}` });
  } else {
    const data = encodeBase64(new Uint8Array(await blob.arrayBuffer()));
    if (kind.kind === 'pdf') {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } });
    } else {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: kind.mediaType as 'image/jpeg' | 'image/png', data },
      });
    }
  }
  content.push({ type: 'text', text: buildUserText(criteria, kind.kind) });

  // Claude
  let result: ScreenResult;
  let usage: Usage = NO_USAGE;
  try {
    const client = new Anthropic({ apiKey, timeout: 120_000, maxRetries: 1 });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content }],
      output_config: { effort: EFFORT, format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    });
    usage = response.usage;
    result = interpretResponse(response, criteria.mustHaves);
  } catch (err) {
    const e = err as { status?: number; message?: string; name?: string };
    console.error('screen-cv: error de la API', e.name, e.status, e.message);
    result = { ok: false, errorReason: mapApiError(e) };
  }

  // Registro de consumo (si falla, no bloquea el resultado)
  const { error: logError } = await supabase.from('ai_calls').insert({
    id: crypto.randomUUID(),
    tenant_id: cand.tenant_id,
    candidate_id: cand.id,
    kind: 'screen_cv',
    model: MODEL,
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    cache_read_tokens: usage.cache_read_input_tokens ?? 0,
    cache_write_tokens: usage.cache_creation_input_tokens ?? 0,
    cost_usd: estimateCostUsd(usage),
    ok: result.ok,
    error: result.ok ? null : result.errorReason,
  });
  if (logError) console.error('screen-cv: no se pudo registrar el consumo', logError.message);

  return json(result);
}

Deno.serve(async (req) => {
  try {
    return await handle(req);
  } catch (err) {
    console.error('screen-cv: error inesperado', err);
    return json({ ok: false, errorReason: 'ai_error' });
  }
});
