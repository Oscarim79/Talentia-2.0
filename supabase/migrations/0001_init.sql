-- ============================================================
--  TALENTIA 2.0 — Schema inicial (BORRADOR para revisar)
--  Pegar en: Supabase → SQL Editor → Run
--
--  NOTA DE REVISIÓN: las políticas RLS aíslan por empresa (tenant) usando
--  el mapeo auth.uid() -> app_users.tenant_id. Antes de producción, revisar
--  estas políticas con calma. Mientras tanto, la app sigue en modo demo
--  (datos seed en memoria); este schema es el destino de la persistencia.
--
--  IDs en TEXT (no uuid) para mantener paridad con los datos demo del front.
-- ============================================================

-- ---------- Tablas ----------
create table if not exists public.plans (
  id text primary key,
  name text not null,
  tier text not null,
  monthly_price_usd numeric not null default 0,
  limits jsonb not null default '{}'::jsonb
);

create table if not exists public.tenants (
  id text primary key,
  name text not null,
  slug text unique not null,
  logo_emoji text,
  industry text,
  plan_id text references public.plans(id),
  status text not null default 'active',
  created_at date not null default now()
);

-- Usuarios de aplicación: el id ES el de auth.users (login real).
create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id text not null references public.tenants(id) on delete cascade,
  name text,
  email text,
  role text not null default 'recruiter'
);

create table if not exists public.jobs (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  title text not null,
  department text,
  location text,
  employment_type text,
  status text not null default 'open',
  salary_min numeric,
  salary_max numeric,
  description text,
  apply_slug text,
  openings int default 1,
  created_at date not null default now(),
  questions jsonb not null default '[]'::jsonb,  -- InterviewQuestion[]
  filters jsonb not null default '[]'::jsonb     -- ScreeningFilter[]
);

create table if not exists public.candidates (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  job_id text references public.jobs(id) on delete set null,
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  stage text not null default 'applied',
  applied_at date not null default now(),
  cv_file_name text,
  screening_status text not null default 'pending',
  screening_score int,
  match_percent int,
  justification text,
  evidence jsonb,   -- EvidenceMatch[]
  flags jsonb,      -- string[]
  error_reason text,
  parsed jsonb      -- ParsedCv
);

create table if not exists public.hires (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  job_id text references public.jobs(id) on delete set null,
  candidate_name text,
  source text,
  opened_at date,
  filled_at date,
  cost_breakdown jsonb not null default '{}'::jsonb  -- { ai, recruiter, advertising }
);

create table if not exists public.usage_events (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  type text not null,
  amount numeric not null default 0,
  cost_usd numeric not null default 0,
  ref_id text,
  created_at date not null default now()
);

-- ---------- Aislamiento multi-tenant (RLS) ----------
-- Devuelve la empresa del usuario autenticado.
create or replace function public.current_tenant_id()
returns text language sql stable security definer set search_path = public as $$
  select tenant_id from public.app_users where id = auth.uid()
$$;

alter table public.tenants       enable row level security;
alter table public.app_users     enable row level security;
alter table public.jobs          enable row level security;
alter table public.candidates    enable row level security;
alter table public.hires         enable row level security;
alter table public.usage_events  enable row level security;
-- plans es catálogo público (solo lectura).
alter table public.plans         enable row level security;

create policy "plans readable" on public.plans for select using (true);

create policy "tenant self read" on public.tenants
  for select using (id = public.current_tenant_id());

create policy "app_user self read" on public.app_users
  for select using (tenant_id = public.current_tenant_id());

-- Lectura + escritura acotada a la empresa del usuario, por cada tabla de datos.
do $$
declare t text;
begin
  foreach t in array array['jobs','candidates','hires','usage_events'] loop
    execute format('create policy "%1$s tenant rw" on public.%1$s for all
      using (tenant_id = public.current_tenant_id())
      with check (tenant_id = public.current_tenant_id());', t);
  end loop;
end $$;

-- ---------- Datos demo (planes, empresas, vacantes…) ----------
-- Opcional: deja el mismo set de datos del front. app_users se crea tras el
-- primer signup real (insertar el id de auth.users con su tenant_id).
insert into public.plans (id, name, tier, monthly_price_usd, limits) values
  ('plan_free','Free','free',0,'{"maxJobs":1,"maxCandidates":25,"screeningCredits":25,"interviewMinutes":0,"seats":1}'),
  ('plan_starter','Starter','starter',49,'{"maxJobs":5,"maxCandidates":250,"screeningCredits":250,"interviewMinutes":120,"seats":3}'),
  ('plan_growth','Growth','growth',199,'{"maxJobs":25,"maxCandidates":2000,"screeningCredits":2000,"interviewMinutes":1000,"seats":10}'),
  ('plan_scale','Scale','scale',499,'{"maxJobs":100,"maxCandidates":10000,"screeningCredits":10000,"interviewMinutes":5000,"seats":50}')
on conflict (id) do nothing;

insert into public.tenants (id, name, slug, logo_emoji, industry, plan_id, status, created_at) values
  ('t_americana','Americana 2000','americana','🏍️','Retail / Motocicletas','plan_growth','active','2026-01-12'),
  ('t_contacta','Contacta BPO','contacta','🎧','Call Center','plan_starter','active','2026-03-04'),
  ('t_novapay','NovaPay','novapay','💳','Fintech','plan_scale','trial','2026-05-20')
on conflict (id) do nothing;
