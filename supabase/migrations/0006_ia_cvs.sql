-- 0006: IA real para CVs (Entrega B).
-- 1) Ruta del CV original en Storage.
-- 2) Bucket privado `cvs` con reglas por empresa.
-- 3) Tabla `ai_calls`: registro de consumo de la IA (no se borra con reset_demo).

-- 1) Ruta del archivo en Storage: <tenant_id>/<candidate_id>/<nombre-seguro>
alter table public.candidates add column if not exists cv_path text;

-- 2) Bucket privado para los CVs (10 MB, solo PDF, imágenes, Word .docx y texto)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs', 'cvs', false, 10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Cada persona solo ve y toca la carpeta de las empresas a las que pertenece.
-- La primera carpeta de la ruta es el tenant_id.
drop policy if exists cvs_select on storage.objects;
create policy cvs_select on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] in (select public.my_tenant_ids()));

drop policy if exists cvs_insert on storage.objects;
create policy cvs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] in (select public.my_tenant_ids()));

drop policy if exists cvs_update on storage.objects;
create policy cvs_update on storage.objects for update to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] in (select public.my_tenant_ids()))
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] in (select public.my_tenant_ids()));

drop policy if exists cvs_delete on storage.objects;
create policy cvs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] in (select public.my_tenant_ids()));

-- 3) Registro de consumo de la IA (una fila por lectura de CV)
create table if not exists public.ai_calls (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  candidate_id text references public.candidates(id) on delete set null,
  kind text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cache_write_tokens int not null default 0,
  cost_usd numeric(10,6) not null default 0,
  ok boolean not null,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists ai_calls_tenant_created_idx on public.ai_calls (tenant_id, created_at);

alter table public.ai_calls enable row level security;

drop policy if exists ai_calls_select on public.ai_calls;
create policy ai_calls_select on public.ai_calls for select to authenticated
  using (tenant_id in (select public.my_tenant_ids()));

drop policy if exists ai_calls_insert on public.ai_calls;
create policy ai_calls_insert on public.ai_calls for insert to authenticated
  with check (tenant_id in (select public.my_tenant_ids()));

-- Solo leer e insertar; nadie edita ni borra el historial de gasto desde la app.
revoke all on public.ai_calls from anon;
revoke all on public.ai_calls from authenticated;
grant select, insert on public.ai_calls to authenticated;
