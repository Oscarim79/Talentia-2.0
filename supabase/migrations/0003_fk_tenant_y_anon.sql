-- TALENTIA 2.0 — Migración 0003: FKs compuestas por empresa + anon sin privilegios por defecto
-- Las FKs ignoran RLS y los ids son texto adivinable: con FKs de una sola columna, alguien de la
-- empresa A podría apuntar a filas de la empresa B. Se reemplazan por FKs (id, tenant_id).

-- Llaves únicas en los padres (necesarias para las FKs compuestas)
alter table public.jobs drop constraint if exists jobs_id_tenant_uq;
alter table public.jobs add constraint jobs_id_tenant_uq unique (id, tenant_id);
alter table public.candidates drop constraint if exists candidates_id_tenant_uq;
alter table public.candidates add constraint candidates_id_tenant_uq unique (id, tenant_id);
alter table public.tenant_members drop constraint if exists tenant_members_id_tenant_uq;
alter table public.tenant_members add constraint tenant_members_id_tenant_uq unique (id, tenant_id);

-- Quitar las FKs de una sola columna
alter table public.candidates drop constraint if exists candidates_job_id_fkey;
alter table public.candidates drop constraint if exists candidates_owner_id_fkey;
alter table public.outreach_messages drop constraint if exists outreach_messages_candidate_id_fkey;
alter table public.interview_evaluations drop constraint if exists interview_evaluations_candidate_id_fkey;
alter table public.help_questions drop constraint if exists help_questions_member_id_fkey;
alter table public.talent_actions_done drop constraint if exists talent_actions_done_done_by_fkey;

-- FKs compuestas (misma empresa obligatoria)
alter table public.candidates
  add constraint candidates_job_tenant_fkey
  foreign key (job_id, tenant_id) references public.jobs (id, tenant_id) on delete cascade;
alter table public.candidates
  add constraint candidates_owner_tenant_fkey
  foreign key (owner_id, tenant_id) references public.tenant_members (id, tenant_id)
  on delete set null (owner_id);
alter table public.outreach_messages
  add constraint outreach_messages_candidate_tenant_fkey
  foreign key (candidate_id, tenant_id) references public.candidates (id, tenant_id) on delete cascade;
alter table public.interview_evaluations
  add constraint interview_evaluations_candidate_tenant_fkey
  foreign key (candidate_id, tenant_id) references public.candidates (id, tenant_id) on delete cascade;
alter table public.help_questions
  add constraint help_questions_member_tenant_fkey
  foreign key (member_id, tenant_id) references public.tenant_members (id, tenant_id)
  on delete set null (member_id);
alter table public.talent_actions_done
  add constraint talent_actions_done_done_by_tenant_fkey
  foreign key (done_by, tenant_id) references public.tenant_members (id, tenant_id)
  on delete set null (done_by);

-- anon: solo puede ejecutar ping()
revoke execute on function public.my_tenant_ids() from anon;
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on functions from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
revoke all on all sequences in schema public from anon;
