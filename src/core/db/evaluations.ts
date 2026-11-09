import { supabase } from '../supabase';
import type { InterviewEvaluation } from '../interviewGuide';
import { stripUndefined } from './rows';

/** Fila de `public.interview_evaluations`. */
export interface EvaluationRow {
  candidate_id: string;
  tenant_id: string;
  job_id: string | null;
  role: string | null;
  interviewer_id: string | null;
  date: string | null; // date
  status: string | null;
  notes: InterviewEvaluation['notes'] | null;
  behavioral: InterviewEvaluation['behavioral'] | null;
  plural_only: InterviewEvaluation['pluralOnly'] | null;
  story_variant: string | null;
  story: InterviewEvaluation['story'] | null;
  choices: InterviewEvaluation['choices'] | null;
  observations: InterviewEvaluation['observations'] | null;
  updated_at: string; // timestamptz
}

export function rowToEvaluation(r: EvaluationRow): InterviewEvaluation {
  return stripUndefined({
    candidateId: r.candidate_id,
    tenantId: r.tenant_id,
    jobId: r.job_id ?? '',
    role: (r.role ?? 'vendedor') as InterviewEvaluation['role'],
    interviewerId: r.interviewer_id ?? '',
    date: r.date ?? '',
    status: (r.status ?? 'draft') as InterviewEvaluation['status'],
    notes: r.notes ?? {},
    behavioral: r.behavioral ?? {},
    pluralOnly: r.plural_only ?? {},
    storyVariant: (r.story_variant ?? 'A') as InterviewEvaluation['storyVariant'],
    story: r.story ?? {},
    choices: r.choices ?? {},
    observations: r.observations ?? {},
    updatedAt: r.updated_at,
  });
}

export function evaluationToRow(ev: InterviewEvaluation): EvaluationRow {
  return {
    candidate_id: ev.candidateId,
    tenant_id: ev.tenantId,
    job_id: ev.jobId,
    role: ev.role,
    interviewer_id: ev.interviewerId,
    date: ev.date,
    status: ev.status,
    notes: ev.notes,
    behavioral: ev.behavioral,
    plural_only: ev.pluralOnly,
    story_variant: ev.storyVariant,
    story: ev.story,
    choices: ev.choices,
    observations: ev.observations,
    updated_at: ev.updatedAt,
  };
}

export async function listEvaluations(tenantId: string): Promise<InterviewEvaluation[]> {
  const { data, error } = await supabase
    .from('interview_evaluations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: true })
    .order('candidate_id', { ascending: true });
  if (error) throw error;
  return (data as EvaluationRow[]).map(rowToEvaluation);
}

export async function upsertEvaluation(ev: InterviewEvaluation): Promise<void> {
  const { error } = await supabase
    .from('interview_evaluations')
    .upsert(evaluationToRow(ev), { onConflict: 'candidate_id' });
  if (error) throw error;
}
