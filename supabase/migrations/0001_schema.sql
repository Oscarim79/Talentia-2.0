-- TALENTIA 2.0 — Migración 0001: esquema multi-empresa (9 tablas)
-- Todas las tablas llevan tenant_id (la empresa) salvo "tenants" misma.

-- Empresas
create table if not exists public.tenants (
  id text primary key,
  name text not null,
  slug text not null unique,
  logo_emoji text,
  industry text,
  brands text[],
  plan_id text,
  status text,
  created_at date
);

-- Miembros del equipo. email null = persona agregada en Configuración (no inicia sesión).
create table if not exists public.tenant_members (
  id text primary key,
  tenant_id text not null references public.tenants(id),
  email text,
  name text not null,
  role text not null check (role in ('owner','admin','recruiter','super_admin')),
  title text
);
create unique index if not exists tenant_members_tenant_email_uq
  on public.tenant_members (tenant_id, lower(email));
create index if not exists tenant_members_tenant_idx on public.tenant_members (tenant_id);

-- Configuración por empresa
create table if not exists public.tenant_settings (
  tenant_id text primary key references public.tenants(id),
  modules jsonb,
  auto_reply jsonb,
  sla jsonb,
  updated_at timestamptz not null default now()
);

-- Vacantes
create table if not exists public.jobs (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  title text not null,
  brand text,
  department text,
  location text,
  employment_type text,
  status text,
  salary_min int,
  salary_max int,
  description text,
  apply_slug text,
  openings int,
  created_at date,
  questions jsonb,
  filters jsonb,
  interview_guide text,
  inserted_at timestamptz not null default now()
);
create index if not exists jobs_tenant_idx on public.jobs (tenant_id);

-- Candidatos
create table if not exists public.candidates (
  id text primary key,
  tenant_id text not null references public.tenants(id),
  job_id text not null references public.jobs(id) on delete cascade,
  owner_id text references public.tenant_members(id) on delete set null,
  timeline jsonb,
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  stage text,
  applied_at date,
  hired_at date,
  cv_file_name text,
  screening_status text,
  screening_score int,
  match_percent int,
  justification text,
  evidence jsonb,
  flags jsonb,
  error_reason text,
  parsed jsonb,
  inserted_at timestamptz not null default now()
);
create index if not exists candidates_tenant_idx on public.candidates (tenant_id);
create index if not exists candidates_job_idx on public.candidates (job_id);

-- Mensajes enviados al candidato
create table if not exists public.outreach_messages (
  id text primary key,
  tenant_id text not null references public.tenants(id),
  candidate_id text not null references public.candidates(id) on delete cascade,
  candidate_name text,
  job_id text,
  channel text,
  "to" text,
  body text,
  status text,
  sent_at timestamptz,
  slot text,
  confirmed_slot text,
  inserted_at timestamptz not null default now()
);
create index if not exists outreach_messages_tenant_idx on public.outreach_messages (tenant_id);
create index if not exists outreach_messages_candidate_idx on public.outreach_messages (candidate_id);

-- Evaluación de entrevista (una por candidato)
create table if not exists public.interview_evaluations (
  candidate_id text primary key references public.candidates(id) on delete cascade,
  tenant_id text not null references public.tenants(id),
  job_id text,
  role text,
  interviewer_id text,
  date date,
  status text,
  notes jsonb,
  behavioral jsonb,
  plural_only jsonb,
  story_variant text,
  story jsonb,
  choices jsonb,
  observations jsonb,
  updated_at timestamptz not null
);
create index if not exists interview_evaluations_tenant_idx on public.interview_evaluations (tenant_id);

-- Preguntas de ayuda
create table if not exists public.help_questions (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references public.tenants(id),
  member_id text references public.tenant_members(id) on delete set null,
  route text,
  question text,
  answered boolean,
  asked_at timestamptz not null default now()
);
create index if not exists help_questions_tenant_idx on public.help_questions (tenant_id);

-- Acciones de talento marcadas como hechas
create table if not exists public.talent_actions_done (
  tenant_id text not null references public.tenants(id),
  person_id text not null,
  done_by text references public.tenant_members(id) on delete set null,
  done_at timestamptz,
  primary key (tenant_id, person_id)
);
