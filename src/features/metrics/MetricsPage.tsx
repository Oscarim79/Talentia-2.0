import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Timer, MailCheck, UserCheck, AlertTriangle, Users, Hourglass, Settings } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { useSettings } from '../../context/SettingsContext';
import { CANDIDATES, DEMO_NOW } from '../../data/seed';
import { Card, PageHeader, StatCard, Badge } from '../../components/ui/primitives';
import { cn } from '../../lib/utils';
import { alerts, jobStats, recruiterStats, stageTimes, teamKpis, type RecruiterStats, type SlaGoals } from './hrMetrics';

const fmtDays = (d: number | null) => (d == null ? '—' : d === 1 ? '1 día' : `${d} días`);
const fmtPct = (p: number | null) => (p == null ? '—' : `${p}%`);

/** Semáforo de una meta de servicio: verde dentro, ámbar hasta +50%, rojo después. */
function slaTone(avg: number | null, sla: number): 'green' | 'amber' | 'red' | 'stone' {
  if (avg == null) return 'stone';
  if (avg <= sla) return 'green';
  if (avg <= sla * 1.5) return 'amber';
  return 'red';
}

export default function MetricsPage() {
  const { tenant } = useTenant();
  const { jobs: allJobs } = useJobs();
  const { settings, hrTeam: users } = useSettings();
  const SLA = settings.sla;
  const jobs = useMemo(() => allJobs.filter((j) => j.tenantId === tenant.id), [allJobs, tenant.id]);

  const [jobId, setJobId] = useState('all');
  const [userId, setUserId] = useState('all');

  const cands = useMemo(
    () =>
      CANDIDATES.filter((c) => c.tenantId === tenant.id)
        .filter((c) => (jobId === 'all' ? true : c.jobId === jobId))
        .filter((c) => (userId === 'all' ? true : c.ownerId === userId)),
    [tenant.id, jobId, userId],
  );

  const kpis = useMemo(() => teamKpis(cands, jobs, users, DEMO_NOW, SLA), [cands, jobs, users, SLA]);
  const byPerson = useMemo(() => recruiterStats(cands, users, DEMO_NOW, SLA), [cands, users, SLA]);
  const stages = useMemo(() => stageTimes(cands, SLA), [cands, SLA]);
  const byJob = useMemo(
    () => jobStats(jobId === 'all' ? jobs : jobs.filter((j) => j.id === jobId), cands, DEMO_NOW),
    [jobs, jobId, cands],
  );
  const pending = useMemo(() => alerts(cands, users, DEMO_NOW, SLA), [cands, users, SLA]);

  const bottleneck = stages.filter((s) => s.avg != null).sort((a, b) => b.avg! / b.sla - a.avg! / a.sla)[0];

  const header = (
    <PageHeader
      eyebrow="Gestión"
      title="Métricas RR.HH."
      subtitle="Cuánto tarda cada quien en hacer lo suyo: revisar, responder, entrevistar, decidir y cerrar."
      actions={
        <Badge variant="stone">
          <Hourglass className="h-3 w-3" /> Corte al {new Date(DEMO_NOW + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'long' })}
        </Badge>
      }
    />
  );

  if (CANDIDATES.filter((c) => c.tenantId === tenant.id).length === 0) {
    return (
      <div>
        {header}
        <Card className="p-12 text-center text-sm text-stone-400">
          Sin candidatos para esta empresa todavía. Las métricas de RR.HH. se calculan sobre el pipeline real.
        </Card>
      </div>
    );
  }

  return (
    <div>
      {header}

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <FilterSelect label="Vacante" value={jobId} onChange={setJobId} options={[{ v: 'all', l: 'Todas las vacantes' }, ...jobs.map((j) => ({ v: j.id, l: j.title }))]} />
        <FilterSelect label="Persona" value={userId} onChange={setUserId} options={[{ v: 'all', l: 'Todo el equipo' }, ...users.map((u) => ({ v: u.id, l: u.name }))]} />
      </div>

      {/* KPIs del equipo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revisar un CV"
          value={fmtDays(kpis.avgReview)}
          delta={`meta: ${SLA.review} días · ${kpis.reviewed} de ${kpis.received} revisados`}
          deltaTone={slaTone(kpis.avgReview, SLA.review) === 'green' ? 'up' : slaTone(kpis.avgReview, SLA.review) === 'amber' ? 'warn' : 'risk'}
          icon={<Timer className="h-5 w-5" />}
        />
        <StatCard
          label="Responder al candidato"
          value={fmtDays(kpis.avgReply)}
          delta={`meta: ${SLA.reply} día · ${kpis.replied} respondidos`}
          deltaTone={slaTone(kpis.avgReply, SLA.reply) === 'green' ? 'up' : slaTone(kpis.avgReply, SLA.reply) === 'amber' ? 'warn' : 'risk'}
          icon={<MailCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Contratar (time-to-hire)"
          value={fmtDays(kpis.avgTimeToHire)}
          delta={kpis.avgTimeToFill != null ? `time-to-fill: ${fmtDays(kpis.avgTimeToFill)} desde que se abrió la vacante` : `${kpis.hires} contrataciones`}
          deltaTone="muted"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Pendientes fuera de meta"
          value={String(kpis.overdue)}
          delta={`${pending.length} pendientes en total`}
          deltaTone={kpis.overdue > 0 ? 'risk' : 'up'}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Cada quien */}
      <Card className="mt-6 overflow-hidden" dataTour="metrics:people">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-stone-700">
            <Users className="h-4 w-4 text-brand-600" /> Cada quien: tiempos y carga por persona
          </h2>
          <p className="text-xs text-stone-400">Promedios en días · verde dentro de la meta, ámbar hasta 1.5×, rojo después</p>
        </div>
        {byPerson.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-400">Sin candidatos asignados con este filtro.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400">
                    <th className="px-5 py-3 font-semibold">Persona</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Asignados</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Activos</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Revisar CV</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Responder</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Entrevistar</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Entrev.</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Ofertas</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Contrat.</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Time-to-hire</th>
                    <th className="whitespace-nowrap px-5 py-3 font-semibold text-right">Pendientes</th>
                  </tr>
                </thead>
                <tbody>
                  {byPerson.map((r) => (
                    <PersonRow key={r.user.id} r={r} sla={SLA} />
                  ))}
                </tbody>
              </table>
            </div>
            {byPerson.length > 1 && (
              <div className="border-t border-stone-100 p-5">
                <p className="mb-2 text-xs font-semibold text-stone-500">Días promedio por persona</p>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={byPerson.map((r) => ({
                        name: r.user.name.split(' ')[0],
                        'Revisar CV': r.avgReview ?? 0,
                        Responder: r.avgReply ?? 0,
                      }))}
                      margin={{ top: 16, right: 8, left: -20, bottom: 0 }}
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#78716c' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#78716c' }} axisLine={false} tickLine={false} unit=" d" />
                      <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 13 }} formatter={(v) => [`${v} días`]} />
                      <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                      <Bar dataKey="Revisar CV" fill="#1f8a66" radius={[4, 4, 0, 0]} maxBarSize={28}>
                        <LabelList dataKey="Revisar CV" position="top" style={{ fontSize: 11, fill: '#57534e' }} />
                      </Bar>
                      <Bar dataKey="Responder" fill="#c99043" radius={[4, 4, 0, 0]} maxBarSize={28}>
                        <LabelList dataKey="Responder" position="top" style={{ fontSize: 11, fill: '#57534e' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tiempo por etapa */}
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-sm font-bold text-stone-700">Tiempo por etapa del proceso</h2>
            {bottleneck && bottleneck.avg! > bottleneck.sla && (
              <Badge variant="amber">
                <AlertTriangle className="h-3 w-3" /> Cuello de botella: {bottleneck.label.toLowerCase()}
              </Badge>
            )}
          </div>
          <div className="space-y-3.5">
            {stages.map((s) => {
              const tone = slaTone(s.avg, s.sla);
              const maxScale = Math.max(...stages.map((x) => Math.max(x.avg ?? 0, x.sla)), 1);
              return (
                <div key={s.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-600">{s.label}</span>
                    <span className="text-stone-500">
                      <b className="text-stone-800">{fmtDays(s.avg)}</b> · meta {s.sla} · {s.n} caso{s.n === 1 ? '' : 's'} · {fmtPct(s.onTime)} a tiempo
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={cn('h-full rounded-full', tone === 'green' ? 'bg-brand-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'red' ? 'bg-red-500' : 'bg-stone-300')}
                      style={{ width: `${((s.avg ?? 0) / maxScale) * 100}%` }}
                    />
                    <div className="absolute top-0 h-full w-0.5 bg-stone-500/60" style={{ left: `${(s.sla / maxScale) * 100}%` }} title={`Meta: ${s.sla} días`} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[11px] text-stone-400">
            <span>La marca vertical es la meta de cada etapa: revisar {SLA.review} d · responder {SLA.reply} d · entrevistar {SLA.interview} d · decidir {SLA.decide} d · cerrar {SLA.close} d.</span>
            <Link to="/configuracion" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
              <Settings className="h-3 w-3" /> Editar metas
            </Link>
          </p>
        </Card>

        {/* Embudo / conversión */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-stone-700">Embudo del periodo</h2>
          <div className="space-y-2.5">
            {kpis.conversion.map((step) => (
              <div key={step.label} className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 font-medium text-stone-600">{step.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${step.pct ?? 0}%` }} />
                </div>
                <span className="w-20 shrink-0 text-right text-stone-500">
                  <b className="text-stone-800">{step.value}</b> · {fmtPct(step.pct)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniStat value={String(kpis.interviews)} label="Entrevistas hechas" />
            <MiniStat value={String(kpis.hires)} label="Contrataciones" accent />
            <MiniStat value={fmtDays(kpis.avgTimeToFill)} label="Time-to-fill" />
          </div>
        </Card>
      </div>

      {/* Por vacante */}
      <Card className="mt-6 overflow-hidden">
        <h2 className="border-b border-stone-100 px-5 py-4 text-sm font-bold text-stone-700">Por vacante</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400">
                <th className="px-5 py-3 font-semibold">Vacante</th>
                <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Días abierta</th>
                <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Candidatos</th>
                <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Activos</th>
                <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Revisar CV</th>
                <th className="whitespace-nowrap px-3 py-3 font-semibold text-right">Plazas cubiertas</th>
                <th className="whitespace-nowrap px-5 py-3 font-semibold text-right">Time-to-fill</th>
              </tr>
            </thead>
            <tbody>
              {byJob.map((j) => (
                <tr key={j.job.id} className="border-b border-stone-50 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-stone-800">{j.job.title}</p>
                    <p className="text-[11px] text-stone-400">{j.job.department} · {j.job.status === 'open' ? 'abierta' : j.job.status}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-stone-600">{j.daysOpen}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-stone-600">{j.candidates}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-stone-600">{j.active}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><Badge variant={slaTone(j.avgReview, SLA.review)}>{fmtDays(j.avgReview)}</Badge></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <Badge variant={j.coverage >= 100 ? 'green' : j.coverage > 0 ? 'amber' : 'stone'}>{j.hires}/{j.job.openings} · {j.coverage}%</Badge>
                  </td>
                  <td className="px-5 py-3 text-right text-stone-600">{fmtDays(j.timeToFill)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pendientes */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-stone-700">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Pendientes por persona
          </h2>
          <Badge variant={kpis.overdue > 0 ? 'red' : 'green'}>{kpis.overdue} fuera de meta</Badge>
        </div>
        {pending.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-400">Nada pendiente con este filtro. Todo al día.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {pending.map((a) => (
              <li key={a.candidate.id + a.kind} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <Badge variant={a.overdue ? 'red' : 'stone'}>{a.overdue ? 'Fuera de meta' : 'En tiempo'}</Badge>
                <span className="font-semibold text-stone-800">{a.label}</span>
                <span className="text-stone-500">{a.candidate.firstName} {a.candidate.lastName}</span>
                <span className="ml-auto text-xs text-stone-500">
                  <b className="text-stone-700">{a.owner?.name ?? 'Sin asignar'}</b> · esperando {fmtDays(a.daysWaiting)} (meta {a.sla})
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-5 text-[11px] leading-relaxed text-stone-400">
        Datos de demostración con corte al {DEMO_NOW}. Los tiempos se calculan con las fechas en que RR.HH. movió a cada candidato de etapa; los CVs ilegibles no cuentan para los promedios pero sí aparecen como pendientes.
      </p>
    </div>
  );
}

// ---------- Subcomponentes ----------

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="font-semibold uppercase tracking-wide text-stone-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500">
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}

function PersonRow({ r, sla: SLA }: { r: RecruiterStats; sla: SlaGoals }) {
  const initials = r.user.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <tr className="border-b border-stone-50 last:border-0">
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">{initials}</div>
          <div>
            <p className="font-semibold text-stone-800">{r.user.name}</p>
            <p className="text-[11px] text-stone-400">{r.user.title ?? (r.user.role === 'admin' ? 'Jefe de RR.HH.' : 'Reclutador/a')}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-stone-600">{r.assigned}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-stone-600">{r.active}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        <Badge variant={slaTone(r.avgReview, SLA.review)}>{fmtDays(r.avgReview)}</Badge>
        <p className="mt-0.5 text-[10px] text-stone-400">{fmtPct(r.reviewOnTime)} a tiempo</p>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        <Badge variant={slaTone(r.avgReply, SLA.reply)}>{fmtDays(r.avgReply)}</Badge>
        <p className="mt-0.5 text-[10px] text-stone-400">{fmtPct(r.replyOnTime)} a tiempo</p>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right"><Badge variant={slaTone(r.avgToInterview, SLA.interview)}>{fmtDays(r.avgToInterview)}</Badge></td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-stone-600">{r.interviews}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-stone-600">{r.offers}</td>
      <td className="px-3 py-3 text-right font-semibold text-green-700">{r.hires}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-stone-600">{fmtDays(r.avgTimeToHire)}</td>
      <td className="whitespace-nowrap px-5 py-3 text-right">
        {r.pendingReview + r.pendingReply === 0 ? (
          <Badge variant="green">0</Badge>
        ) : (
          <>
            <Badge variant={r.avgWaiting != null && r.avgWaiting > SLA.review ? 'red' : 'amber'}>{r.pendingReview + r.pendingReply}</Badge>
            <p className="mt-0.5 text-[10px] text-stone-400">{r.pendingReview} revisar · {r.pendingReply} responder</p>
          </>
        )}
      </td>
    </tr>
  );
}

function MiniStat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-stone-100 p-3">
      <p className={cn('font-display text-2xl font-semibold', accent ? 'text-green-600' : 'text-stone-900')}>{value}</p>
      <p className="mt-0.5 text-xs text-stone-500">{label}</p>
    </div>
  );
}
