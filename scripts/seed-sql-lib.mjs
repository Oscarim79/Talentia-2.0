// Funciones puras para convertir el seed de TypeScript en SQL con fechas relativas a "hoy".
// Las usa scripts/gen-seed-sql.mjs; las pruebas están en seed-sql-lib.test.mjs.

const DAY_MS = 86400000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Días entre una fecha AAAA-MM-DD y el ancla (la "fecha de hoy" del seed). */
export function daysBefore(iso, anchor) {
  return Math.round((Date.parse(anchor) - Date.parse(iso)) / DAY_MS);
}

/** Literal de texto SQL con comillas simples escapadas. */
export function sqlStr(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

/** Fecha relativa a hoy, como texto (las columnas date la aceptan al hacer cast). */
export function relDate(iso, anchor) {
  return `(current_date - ${daysBefore(iso, anchor)})::text`;
}

/** Valor escalar SQL (null, número, booleano, fecha relativa o texto). */
function scalar(v, anchor) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'string' && ISO_DATE.test(v)) return relDate(v, anchor);
  return sqlStr(v);
}

/** Objeto plano con fechas (como `timeline`) → jsonb_build_object con fechas relativas; omite undefined. */
export function relJsonb(obj, anchor) {
  const entries = Object.entries(obj ?? {}).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "'{}'::jsonb";
  return `jsonb_build_object(${entries.map(([k, v]) => `${sqlStr(k)}, ${scalar(v, anchor)}`).join(', ')})`;
}

/** jsonb sin fechas: cadena JSON literal. undefined/null → null. */
function jsonLit(x) {
  return x === undefined || x === null ? 'null' : `${sqlStr(JSON.stringify(x))}::jsonb`;
}

/** Texto o null (para columnas de texto; también tenants.created_at, que queda literal). */
function text(v) {
  return v === undefined || v === null ? 'null' : sqlStr(v);
}

function dateCol(iso, anchor) {
  return iso ? `${relDate(iso, anchor)}::date` : 'null';
}

export function tenantsSql(tenants) {
  return tenants
    .map((t) => {
      const brands = `array[${(t.brands ?? []).map(sqlStr).join(', ')}]::text[]`;
      return (
        `insert into public.tenants (id, name, slug, logo_emoji, industry, brands, plan_id, status, created_at)\n` +
        `values (${[t.id, t.name, t.slug, t.logoEmoji, t.industry].map(text).join(', ')}, ${brands}, ${text(t.planId)}, ${text(t.status)}, ${text(t.createdAt)}::date)\n` +
        `on conflict (id) do nothing;`
      );
    })
    .join('\n');
}

export function membersSql(users) {
  return users
    .map(
      (u) =>
        `insert into public.tenant_members (id, tenant_id, email, name, role, title)\n` +
        `values (${[u.id, u.tenantId, u.email, u.name, u.role, u.title].map(text).join(', ')})\n` +
        `on conflict do nothing;`,
    )
    .join('\n');
}

function jobInsert(j, anchor) {
  return `    insert into public.jobs (id, tenant_id, title, brand, department, location, employment_type, status, salary_min, salary_max, description, apply_slug, openings, created_at, questions, filters, interview_guide)
    values (${[j.id, j.tenantId, j.title, j.brand, j.department, j.location, j.employmentType, j.status].map(text).join(', ')}, ${scalar(j.salaryMin, anchor)}, ${scalar(j.salaryMax, anchor)}, ${text(j.description)}, ${text(j.applySlug)}, ${scalar(j.openings, anchor)}, ${dateCol(j.createdAt, anchor)}, ${jsonLit(j.questions)}, ${jsonLit(j.filters)}, ${text(j.interviewGuide)});`;
}

function candidateInsert(c, ownerIds, anchor) {
  // owner_id solo si es miembro de la misma empresa (FK compuesta).
  const owner = c.ownerId && ownerIds.has(c.ownerId) ? sqlStr(c.ownerId) : 'null';
  return `    insert into public.candidates (id, tenant_id, job_id, owner_id, timeline, first_name, last_name, email, phone, source, stage, applied_at, hired_at, cv_file_name, screening_status, screening_score, match_percent, justification, evidence, flags, error_reason, parsed)
    values (${[c.id, c.tenantId, c.jobId].map(text).join(', ')}, ${owner}, ${c.timeline ? relJsonb(c.timeline, anchor) : 'null'}, ${[c.firstName, c.lastName, c.email, c.phone, c.source, c.stage].map(text).join(', ')}, ${dateCol(c.appliedAt, anchor)}, ${dateCol(c.hiredAt, anchor)}, ${text(c.cvFileName)}, ${text(c.screeningStatus)}, ${scalar(c.screeningScore, anchor)}, ${scalar(c.matchPercent, anchor)}, ${text(c.justification)}, ${jsonLit(c.evidence)}, ${jsonLit(c.flags)}, ${text(c.errorReason)}, ${jsonLit(c.parsed)});`;
}

function evaluationInsert(e, anchor) {
  const days = daysBefore(e.date, anchor);
  return `    insert into public.interview_evaluations (candidate_id, tenant_id, job_id, role, interviewer_id, date, status, notes, behavioral, plural_only, story_variant, story, choices, observations, updated_at)
    values (${[e.candidateId, e.tenantId, e.jobId, e.role, e.interviewerId].map(text).join(', ')}, ${dateCol(e.date, anchor)}, ${text(e.status)}, ${jsonLit(e.notes)}, ${jsonLit(e.behavioral)}, ${jsonLit(e.pluralOnly)}, ${text(e.storyVariant)}, ${jsonLit(e.story)}, ${jsonLit(e.choices)}, ${jsonLit(e.observations)}, now() - interval '${days} days');`;
}

/**
 * Función plpgsql que siembra los datos de ejemplo de una empresa, con fechas relativas a hoy.
 * Los dueños (owner_id) solo se emiten si son miembros de la MISMA empresa (FK compuesta).
 */
export function seedTenantFunctionSql(jobs, candidates, evaluations, anchor, users = []) {
  const tenantIds = [...new Set([...jobs, ...candidates, ...evaluations].map((x) => x.tenantId))];
  const blocks = tenantIds.map((tid) => {
    const ownerIds = new Set(users.filter((u) => u.tenantId === tid).map((u) => u.id));
    const parts = [
      ...jobs.filter((j) => j.tenantId === tid).map((j) => jobInsert(j, anchor)),
      ...candidates.filter((c) => c.tenantId === tid).map((c) => candidateInsert(c, ownerIds, anchor)),
      ...evaluations.filter((e) => e.tenantId === tid).map((e) => evaluationInsert(e, anchor)),
    ];
    return `  if p_tenant_id = ${sqlStr(tid)} then\n${parts.join('\n')}\n  end if;`;
  });
  return `create or replace function public.seed_tenant(p_tenant_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
${blocks.join('\n')}
end $$;`;
}

export function resetDemoFunctionSql() {
  return `create or replace function public.reset_demo(p_tenant_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from tenant_members m where m.tenant_id = p_tenant_id
      and m.email is not null and lower(m.email) = lower(coalesce(auth.email(), ''))
      and m.role in ('owner','admin','super_admin')) then
    raise exception 'Solo un jefe de RR.HH. o el administrador puede restablecer la demo';
  end if;
  delete from talent_actions_done where tenant_id = p_tenant_id;
  delete from jobs where tenant_id = p_tenant_id; -- cascada: candidatos, mensajes, evaluaciones
  delete from tenant_settings where tenant_id = p_tenant_id;
  delete from tenant_members where tenant_id = p_tenant_id and email is null;
  perform seed_tenant(p_tenant_id);
end $$;`;
}
