-- TALENTIA 2.0 — Migración 0002: seguridad por filas (RLS) por membresía
-- El vínculo con Auth es por correo: auth.email() == tenant_members.email (minúsculas).

-- Empresas a las que pertenece quien está conectado
create or replace function public.my_tenant_ids()
returns setof text
language sql stable security definer
set search_path = public
as $$
  select tenant_id from public.tenant_members
  where email is not null and lower(email) = lower(coalesce(auth.email(), ''))
$$;
revoke all on function public.my_tenant_ids() from public;
grant execute on function public.my_tenant_ids() to authenticated;

-- Activar RLS (sin "force": las funciones definer deben seguir viéndolo todo)
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.interview_evaluations enable row level security;
alter table public.help_questions enable row level security;
alter table public.talent_actions_done enable row level security;

-- tenants: solo lectura de las empresas propias
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants for select to authenticated
  using (id in (select public.my_tenant_ids()));

-- Tablas con política única para todo
drop policy if exists tenant_settings_all on public.tenant_settings;
create policy tenant_settings_all on public.tenant_settings for all to authenticated
  using (tenant_id in (select public.my_tenant_ids()))
  with check (tenant_id in (select public.my_tenant_ids()));

drop policy if exists jobs_all on public.jobs;
create policy jobs_all on public.jobs for all to authenticated
  using (tenant_id in (select public.my_tenant_ids()))
  with check (tenant_id in (select public.my_tenant_ids()));

drop policy if exists candidates_all on public.candidates;
create policy candidates_all on public.candidates for all to authenticated
  using (tenant_id in (select public.my_tenant_ids()))
  with check (tenant_id in (select public.my_tenant_ids()));

drop policy if exists outreach_messages_all on public.outreach_messages;
create policy outreach_messages_all on public.outreach_messages for all to authenticated
  using (tenant_id in (select public.my_tenant_ids()))
  with check (tenant_id in (select public.my_tenant_ids()));

drop policy if exists interview_evaluations_all on public.interview_evaluations;
create policy interview_evaluations_all on public.interview_evaluations for all to authenticated
  using (tenant_id in (select public.my_tenant_ids()))
  with check (tenant_id in (select public.my_tenant_ids()));

drop policy if exists talent_actions_done_all on public.talent_actions_done;
create policy talent_actions_done_all on public.talent_actions_done for all to authenticated
  using (tenant_id in (select public.my_tenant_ids()))
  with check (tenant_id in (select public.my_tenant_ids()));

-- tenant_members: leer; agregar y quitar solo personas sin correo; sin update
drop policy if exists tenant_members_select on public.tenant_members;
create policy tenant_members_select on public.tenant_members for select to authenticated
  using (tenant_id in (select public.my_tenant_ids()));

drop policy if exists tenant_members_insert on public.tenant_members;
create policy tenant_members_insert on public.tenant_members for insert to authenticated
  with check (tenant_id in (select public.my_tenant_ids()) and email is null);

drop policy if exists tenant_members_delete on public.tenant_members;
create policy tenant_members_delete on public.tenant_members for delete to authenticated
  using (tenant_id in (select public.my_tenant_ids()) and email is null);

-- help_questions: leer/insertar para miembros; borrar solo owner/admin/super_admin
drop policy if exists help_questions_select on public.help_questions;
create policy help_questions_select on public.help_questions for select to authenticated
  using (tenant_id in (select public.my_tenant_ids()));

drop policy if exists help_questions_insert on public.help_questions;
create policy help_questions_insert on public.help_questions for insert to authenticated
  with check (tenant_id in (select public.my_tenant_ids()));

drop policy if exists help_questions_delete on public.help_questions;
create policy help_questions_delete on public.help_questions for delete to authenticated
  using (
    tenant_id in (select public.my_tenant_ids())
    and exists (
      select 1 from public.tenant_members m
      where m.tenant_id = help_questions.tenant_id
        and lower(m.email) = lower(auth.email())
        and m.role in ('owner','admin','super_admin')
    )
  );

-- ping: lo usa la tarea diaria para evitar la pausa por inactividad (única puerta para anon)
create or replace function public.ping()
returns int
language sql stable security definer
set search_path = public
as $$ select count(*)::int from public.tenants $$;
grant execute on function public.ping() to anon, authenticated;

-- anon (sin sesión) no toca ninguna tabla
revoke all on all tables in schema public from anon;
