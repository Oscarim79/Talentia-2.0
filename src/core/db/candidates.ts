import { supabase } from '../supabase';
import type { Candidate, CandidateTimeline, EvidenceMatch, ParsedCv } from '../../types';
import { nullToUndefined, stripUndefined } from './rows';

/** Fila de `public.candidates`. */
export interface CandidateRow {
  id: string;
  tenant_id: string;
  job_id: string;
  owner_id: string | null;
  timeline: CandidateTimeline | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  stage: string | null;
  applied_at: string | null; // date
  hired_at: string | null; // date
  cv_file_name: string | null;
  cv_path: string | null;
  screening_status: string | null;
  screening_score: number | null;
  match_percent: number | null;
  justification: string | null;
  evidence: EvidenceMatch[] | null;
  flags: string[] | null;
  error_reason: string | null;
  parsed: ParsedCv | null;
  inserted_at?: string; // lo pone la base de datos
}

/** Campos que la app actualiza después de crear el candidato (etapa, fechas, dueño y el resultado del screening). */
export type CandidatePatch = Partial<
  Pick<
    Candidate,
    | 'stage'
    | 'timeline'
    | 'hiredAt'
    | 'ownerId'
    | 'screeningStatus'
    | 'screeningScore'
    | 'matchPercent'
    | 'justification'
    | 'evidence'
    | 'flags'
    | 'errorReason'
    | 'parsed'
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'cvPath'
  >
>;

const PATCH_COLUMNS: { [K in keyof CandidatePatch]-?: keyof CandidateRow } = {
  stage: 'stage',
  timeline: 'timeline',
  hiredAt: 'hired_at',
  ownerId: 'owner_id',
  screeningStatus: 'screening_status',
  screeningScore: 'screening_score',
  matchPercent: 'match_percent',
  justification: 'justification',
  evidence: 'evidence',
  flags: 'flags',
  errorReason: 'error_reason',
  parsed: 'parsed',
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  phone: 'phone',
  cvPath: 'cv_path',
};

/** Campos que en el tipo de dominio son obligatorios: si vienen sin valor no se tocan (nunca se mandan como null). */
const NEVER_NULL: ReadonlySet<keyof CandidatePatch> = new Set(['stage', 'screeningStatus', 'firstName', 'lastName', 'email', 'phone']);

export function rowToCandidate(r: CandidateRow): Candidate {
  return stripUndefined({
    id: r.id,
    tenantId: r.tenant_id,
    jobId: r.job_id,
    ownerId: nullToUndefined(r.owner_id),
    timeline: nullToUndefined(r.timeline),
    firstName: r.first_name ?? '',
    lastName: r.last_name ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    source: r.source ?? '',
    stage: (r.stage ?? 'applied') as Candidate['stage'],
    appliedAt: r.applied_at ?? '',
    hiredAt: nullToUndefined(r.hired_at),
    cvFileName: r.cv_file_name ?? '',
    cvPath: nullToUndefined(r.cv_path),
    screeningStatus: (r.screening_status ?? 'pending') as Candidate['screeningStatus'],
    screeningScore: nullToUndefined(r.screening_score),
    matchPercent: nullToUndefined(r.match_percent),
    justification: nullToUndefined(r.justification),
    evidence: nullToUndefined(r.evidence),
    flags: nullToUndefined(r.flags),
    errorReason: nullToUndefined(r.error_reason),
    parsed: nullToUndefined(r.parsed),
  });
}

export function candidateToRow(c: Candidate): CandidateRow {
  return {
    id: c.id,
    tenant_id: c.tenantId,
    job_id: c.jobId,
    owner_id: c.ownerId ?? null,
    timeline: c.timeline ?? null,
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email,
    phone: c.phone,
    source: c.source,
    stage: c.stage,
    applied_at: c.appliedAt,
    hired_at: c.hiredAt ?? null,
    cv_file_name: c.cvFileName,
    cv_path: c.cvPath ?? null,
    screening_status: c.screeningStatus,
    screening_score: c.screeningScore ?? null,
    match_percent: c.matchPercent ?? null,
    justification: c.justification ?? null,
    evidence: c.evidence ?? null,
    flags: c.flags ?? null,
    error_reason: c.errorReason ?? null,
    parsed: c.parsed ?? null,
  };
}

/** Solo las claves presentes en el parche; una clave presente con `undefined` se envía como null. */
export function candidatePatchToRow(patch: CandidatePatch): Partial<CandidateRow> {
  const row: Record<string, unknown> = {};
  for (const key of Object.keys(patch) as (keyof CandidatePatch)[]) {
    const value = patch[key];
    if (value === undefined && NEVER_NULL.has(key)) continue;
    row[PATCH_COLUMNS[key]] = value ?? null;
  }
  return row as Partial<CandidateRow>;
}

export async function listCandidates(tenantId: string): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('inserted_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return (data as CandidateRow[]).map(rowToCandidate);
}

export async function insertCandidate(c: Candidate): Promise<void> {
  const { error } = await supabase.from('candidates').insert(candidateToRow(c));
  if (error) throw error;
}

export async function updateCandidate(id: string, patch: CandidatePatch): Promise<void> {
  const row = candidatePatchToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from('candidates').update(row).eq('id', id);
  if (error) throw error;
}
