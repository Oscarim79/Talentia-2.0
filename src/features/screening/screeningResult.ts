// ============================================================
//  Reglas puras de la pantalla Screening IA con lectura real:
//  candidato provisional ("Procesando…"), cómo se convierte el resultado
//  de la IA en el parche del candidato y qué estado muestra una fila pendiente.
// ============================================================
import type { CandidatePatch } from '../../core/db/candidates';
import type { ScreenOutcome } from '../../core/ports';
import type { ScreeningErrorCode } from '../../core/screeningErrors';
import type { Candidate, Job } from '../../types';

const NAME_NOISE = /\b(cv|curriculum|curriculo|hoja|de|vida|resume|resumen|scan|foto|imagen|final|v\d+)\b/gi;

/** Deriva un nombre legible desde el nombre real del archivo subido (provisional hasta que la IA lea el CV). */
export function nameFromFile(file: string): { firstName: string; lastName: string } {
  const base = file
    .replace(/\.[a-z0-9]+$/i, '') // extensión
    .replace(/[_\-.]+/g, ' ')
    .replace(NAME_NOISE, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = base
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  if (parts.length === 0) return { firstName: 'Nuevo', lastName: 'Candidato' };
  if (parts.length === 1) return { firstName: parts[0], lastName: 'CV' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** Candidato en estado "pending": aparece de inmediato mientras la IA lee el archivo. */
export function makePendingCandidate(
  file: { name: string },
  job: Job,
  candidateId: string,
  cvPath: string | undefined,
  today: string,
): Candidate {
  const { firstName, lastName } = nameFromFile(file.name);
  return {
    id: candidateId,
    tenantId: job.tenantId,
    jobId: job.id,
    firstName,
    lastName,
    email: '',
    phone: '',
    source: 'Carga directa',
    stage: 'screening',
    appliedAt: today,
    cvFileName: file.name,
    ...(cvPath ? { cvPath } : {}),
    screeningStatus: 'pending',
  };
}

/** Archivo rechazado antes de subirlo (formato o tamaño): candidato directo en la cola de errores, sin archivo guardado. */
export function makeInvalidCandidate(
  file: { name: string },
  job: Job,
  candidateId: string,
  reason: ScreeningErrorCode,
  today: string,
): Candidate {
  return {
    ...makePendingCandidate(file, job, candidateId, undefined, today),
    screeningStatus: 'error',
    stage: 'applied',
    errorReason: reason,
  };
}

/** Errores en los que no quedó archivo en Storage: se quita `cvPath` para que no aparezca un "Ver CV" que no abre nada. */
const FILE_ERRORS: ReadonlySet<ScreeningErrorCode> = new Set(['unsupported_format', 'too_large', 'upload_failed']);

/** Parche del candidato a partir del resultado de la IA (o del error). */
export function outcomeToPatch(
  outcome: ScreenOutcome,
  provisional: { firstName: string; lastName: string },
  today: string,
): CandidatePatch {
  if (!outcome.ok) {
    return {
      screeningStatus: 'error',
      stage: 'applied',
      errorReason: outcome.errorReason,
      ...(FILE_ERRORS.has(outcome.errorReason) ? { cvPath: undefined } : {}),
    };
  }
  const { person, parsed, score } = outcome;
  const first = person.firstName.trim();
  const last = person.lastName.trim();
  const hasName = first.length > 0 && last.length > 0;
  return {
    screeningStatus: 'scored',
    stage: 'screening',
    firstName: hasName ? first : provisional.firstName,
    lastName: hasName ? last : provisional.lastName,
    email: person.email.trim(),
    phone: person.phone.trim(),
    screeningScore: score.score,
    matchPercent: score.matchPercent,
    justification: score.justification,
    evidence: score.evidence,
    flags: score.flags,
    parsed,
    errorReason: undefined,
    timeline: { screened: today },
  };
}

/** 'processing' si la lectura va en curso en esta pestaña; 'stale' si quedó pendiente (p. ej. se cerró la pestaña); null si no está pendiente. */
export function pendingState(c: Candidate, inFlight: ReadonlySet<string>): 'processing' | 'stale' | null {
  if (c.screeningStatus !== 'pending') return null;
  return inFlight.has(c.id) ? 'processing' : 'stale';
}
