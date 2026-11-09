import { supabase } from '../supabase';
import type { InterviewQuestion, Job, ScreeningFilter } from '../../types';
import { nullToUndefined, stripUndefined } from './rows';

/** Fila de `public.jobs`. */
export interface JobRow {
  id: string;
  tenant_id: string;
  title: string;
  brand: string | null;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  status: string | null;
  salary_min: number | null;
  salary_max: number | null;
  description: string | null;
  apply_slug: string | null;
  openings: number | null;
  created_at: string | null; // date 'YYYY-MM-DD'
  questions: InterviewQuestion[] | null;
  filters: ScreeningFilter[] | null;
  interview_guide: string | null;
  inserted_at?: string; // lo pone la base de datos
}

export function rowToJob(r: JobRow): Job {
  return stripUndefined({
    id: r.id,
    tenantId: r.tenant_id,
    title: r.title,
    brand: r.brand ?? '',
    department: r.department ?? '',
    location: r.location ?? '',
    employmentType: (r.employment_type ?? 'Full-time') as Job['employmentType'],
    status: (r.status ?? 'draft') as Job['status'],
    salaryMin: r.salary_min ?? 0,
    salaryMax: r.salary_max ?? 0,
    description: r.description ?? '',
    applySlug: r.apply_slug ?? '',
    openings: r.openings ?? 1,
    createdAt: r.created_at ?? '',
    questions: r.questions ?? [],
    filters: r.filters ?? [],
    interviewGuide: nullToUndefined(r.interview_guide) as Job['interviewGuide'],
  });
}

export function jobToRow(j: Job): JobRow {
  return {
    id: j.id,
    tenant_id: j.tenantId,
    title: j.title,
    brand: j.brand,
    department: j.department,
    location: j.location,
    employment_type: j.employmentType,
    status: j.status,
    salary_min: j.salaryMin,
    salary_max: j.salaryMax,
    description: j.description,
    apply_slug: j.applySlug,
    openings: j.openings,
    created_at: j.createdAt,
    questions: j.questions,
    filters: j.filters,
    interview_guide: j.interviewGuide ?? null,
  };
}

export async function listJobs(tenantId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('inserted_at', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: true });
  if (error) throw error;
  return (data as JobRow[]).map(rowToJob);
}

export async function insertJob(job: Job): Promise<void> {
  const { error } = await supabase.from('jobs').insert(jobToRow(job));
  if (error) throw error;
}
