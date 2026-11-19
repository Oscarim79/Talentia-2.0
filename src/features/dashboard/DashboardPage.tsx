import { Briefcase, Users, ScanSearch, Timer, TrendingDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { USAGE_EVENTS } from '../../data/seed';
import { useCandidates } from '../../context/CandidatesContext';
import { todayISO } from '../../lib/dates';
import { useSettings } from '../../context/SettingsContext';
import { Card, PageHeader, StatCard, Badge, ProgressBar } from '../../components/ui/primitives';
import { teamKpis } from '../metrics/hrMetrics';
import { scoreVariant } from '../../components/ui/primitives';
import { chartTooltipStyle, useChartColors } from '../../lib/chartTheme';
import { buildFunnel } from './funnel';
import type { CandidateStage } from '../../types';

export default function DashboardPage() {
  const { tenant } = useTenant();
  const { jobs: allJobs } = useJobs();
  const { settings, hrTeam } = useSettings();
  const jobs = allJobs.filter((j) => j.tenantId === tenant.id);
  const { candidates: cands } = useCandidates();
  const today = todayISO();
  const usage = USAGE_EVENTS.filter((u) => u.tenantId === tenant.id);
  const colors = useChartColors();

  const openJobs = jobs.filter((j) => j.status === 'open').length;
  const screeningUsed = usage.filter((u) => u.type === 'screening').reduce((s, u) => s + u.amount, 0);
  const kpis = teamKpis(cands, jobs, hrTeam, today, settings.sla);

  const counts: Partial<Record<CandidateStage, number>> = {};
  for (const c of cands) counts[c.stage] = (counts[c.stage] ?? 0) + 1;
  const { stages, biggestDrop } = buildFunnel(counts);
  const funnel = stages.map((s, i) => ({
    ...s,
    color: colors.funnel[i],
    // Encima de cada barra: cuántos llegaron y qué % de la etapa anterior.
    mark: s.pct == null ? String(s.reached) : `${s.reached} · ${s.pct} %`,
  }));

  const topCandidates = [...cands]
    .filter((c) => c.screeningStatus === 'scored')
    .sort((a, b) => (b.screeningScore ?? 0) - (a.screeningScore ?? 0))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        eyebrow="Resumen"
        title={`Hola, ${tenant.name}`}
        subtitle="Resumen de tu reclutamiento automatizado con IA"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vacantes abiertas" value={String(openJobs)} icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Candidatos" value={String(cands.length)} delta={cands.length ? '+ activos esta semana' : undefined} icon={<Users className="h-5 w-5" />} />
        <StatCard label="CVs analizados (IA)" value={String(screeningUsed)} icon={<ScanSearch className="h-5 w-5" />} />
        <StatCard
          label="Pendientes fuera de meta"
          value={String(kpis.overdue)}
          delta={kpis.avgReview != null ? `revisión de CV: ${kpis.avgReview} días promedio` : undefined}
          deltaTone={kpis.overdue > 0 ? 'warn' : 'up'}
          icon={<Timer className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-bold text-neutral-700">Embudo de reclutamiento</h2>
          <p className="mb-4 mt-0.5 text-xs text-neutral-500">
            Cada barra cuenta a quienes llegaron a esa etapa o más allá; el porcentaje es respecto a la etapa anterior.
          </p>
          {cands.length === 0 ? (
            <EmptyState text="Aún no hay candidatos para esta empresa. Ve a Screening IA para cargar CVs." />
          ) : (
            <>
              <div style={{ height: 280 }} aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel} margin={{ top: 24, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: colors.tick }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: colors.tick }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: colors.cursor }}
                      contentStyle={chartTooltipStyle(colors)}
                      formatter={(v) => [`${v} candidatos`, 'Llegaron']}
                    />
                    <Bar dataKey="reached" radius={[6, 6, 0, 0]}>
                      {funnel.map((f) => (
                        <Cell key={f.key} fill={f.color} />
                      ))}
                      <LabelList dataKey="mark" position="top" style={{ fontSize: 12, fontWeight: 600, fill: colors.label }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* La misma información en texto, para lectores de pantalla y para copiar. */}
              <ul className="sr-only">
                {funnel.map((f) => (
                  <li key={f.key}>
                    {f.label}: {f.reached} candidatos{f.pct != null ? ` (${f.pct} % de la etapa anterior)` : ''}
                  </li>
                ))}
              </ul>
              {biggestDrop && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-800">
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                  Mayor caída: {biggestDrop.from} → {biggestDrop.to} (se pierde el {biggestDrop.lossPct} %).
                </p>
              )}
            </>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Mejores candidatos (IA)</h2>
          {topCandidates.length === 0 ? (
            <EmptyState text="Sin candidatos puntuados todavía." />
          ) : (
            <ul className="space-y-3">
              {topCandidates.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {c.firstName[0]}
                    {c.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-800">
                      {c.firstName} {c.lastName}
                    </p>
                    <ProgressBar value={c.screeningScore ?? 0} className="mt-1" />
                  </div>
                  <Badge variant={scoreVariant(c.screeningScore ?? 0)}>{c.screeningScore}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-neutral-200 px-6 text-center text-sm text-neutral-500">
      {text}
    </div>
  );
}
