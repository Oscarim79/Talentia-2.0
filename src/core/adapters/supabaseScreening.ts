// ============================================================
//  Adaptador REAL de lectura de CVs (Entrega B).
//  Sube el archivo original al bucket privado `cvs`, convierte los .docx a
//  texto en el navegador (mammoth) y llama a la Edge Function `screen-cv`,
//  que es la única que habla con Claude. El candidato lo escribe la app.
// ============================================================
import mammoth from 'mammoth';
import { supabase } from '../supabase';
import type { CvScreeningPort, ScreenOutcome } from '../ports';
import { SCREENING_ERRORS, type ScreeningErrorCode } from '../screeningErrors';

export const MAX_FILE_MB = 10;
/** Las imágenes viajan en base64 (un tercio más grandes) y el API las limita a 10 MB ya codificadas. */
export const MAX_IMAGE_MB = 7;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const BUCKET = 'cvs';
const TEXT_FILE = 'texto.txt';

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function ext(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i + 1).toLowerCase();
}

/** Código de error si el archivo no se puede procesar; null si es válido. */
export function validateFile(f: { name: string; size: number }): ScreeningErrorCode | null {
  const e = ext(f.name);
  if (!MIME[e]) return 'unsupported_format';
  const limit = MIME[e].startsWith('image/') ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (f.size > limit) return 'too_large';
  return null;
}

/** Nombre apto para Storage: sin acentos ni espacios, solo a-z 0-9 . _ -, máximo 80 caracteres. */
export function safeFileName(name: string): string {
  const e = ext(name);
  const base = e ? name.slice(0, name.length - e.length - 1) : name;
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  const suffix = e ? `.${e}` : '';
  return (slug || 'cv').slice(0, 80 - suffix.length) + suffix;
}

/** Ruta del original en Storage: <empresa>/<candidato>/<nombre-seguro>. */
export function cvPathFor(tenantId: string, candidateId: string, fileName: string): string {
  return `${tenantId}/${candidateId}/${safeFileName(fileName)}`;
}

export function mimeFor(name: string): string {
  return MIME[ext(name)] ?? 'application/octet-stream';
}

export function isDocx(name: string): boolean {
  return ext(name) === 'docx';
}

/** Texto plano de un .docx (se pierde el formato, no el contenido). */
export async function extractDocxText(file: Blob): Promise<string> {
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value.trim();
}

function textPathFor(cvPath: string): string {
  return `${cvPath.slice(0, cvPath.lastIndexOf('/') + 1)}${TEXT_FILE}`;
}

function isOutcome(d: unknown): d is ScreenOutcome {
  if (typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  if (o.ok === false) return typeof o.errorReason === 'string' && o.errorReason in SCREENING_ERRORS;
  return o.ok === true && typeof o.person === 'object' && typeof o.parsed === 'object' && typeof o.score === 'object';
}

async function invoke(candidateId: string): Promise<ScreenOutcome> {
  const { data, error } = await supabase.functions.invoke<unknown>('screen-cv', { body: { candidateId } });
  if (error || !isOutcome(data)) return { ok: false, errorReason: 'ai_error' };
  return data;
}

export const supabaseScreening: CvScreeningPort = {
  async screen({ file, candidateId, cvPath }) {
    const invalid = validateFile(file);
    if (invalid) return { ok: false, errorReason: invalid };

    const bucket = supabase.storage.from(BUCKET);
    const { error: upError } = await bucket.upload(cvPath, file, { contentType: mimeFor(file.name), upsert: true });
    if (upError) return { ok: false, errorReason: 'upload_failed' };

    if (isDocx(file.name)) {
      let text = '';
      try {
        text = await extractDocxText(file);
      } catch {
        return { ok: false, errorReason: 'corrupt' };
      }
      if (!text) return { ok: false, errorReason: 'corrupt' };
      const { error: txtError } = await bucket.upload(textPathFor(cvPath), new Blob([text], { type: 'text/plain' }), {
        contentType: 'text/plain',
        upsert: true,
      });
      if (txtError) return { ok: false, errorReason: 'upload_failed' };
    }

    return invoke(candidateId);
  },

  retry(candidateId) {
    return invoke(candidateId);
  },

  async cvUrl(cvPath) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(cvPath, 60);
    return data?.signedUrl ?? null;
  },
};
