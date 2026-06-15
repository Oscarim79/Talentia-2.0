import { TrendingDown, Clock, DollarSign, PiggyBank, Sparkles } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { HIRES, MANUAL_BENCHMARK_USD } from '../../data/seed';
import { Card, PageHeader, StatCard, Badge, ProgressBar } from '../../components/ui/primitives';
import { fmtMoney } from '../../lib/utils';
import type { Hire } from '../../types';

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function hireCost(h: Hire): number {
  return h.costBreakdown.ai + h.costBreakdown.recruiter + h.costBreakdown.advertising;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function MetricsPage() {
  const { tenant } = useTenant();
  const { jobs } = useJobs();
  const hires = HIRES.filter((h) => h.tenantId === tenant.id);

  const count = hires.length;
  const avgDays = count ? Math.round(hires.reduce((s, h) => s + daysBetween(h.openedAt, h.filledAt), 0) / count) : 0;
  const totalCost = hires.reduce((s, h) => s + hireCost(h), 0);
  const avgCost = count ? totalCost / count : 0;

  // Ahorro estimado frente a un proceso manual (benchmark de mercado).
  const savingsTotal = count ? (MANUAL_BENCHMARK_USD - avgCost) * count : 0;
  const savingsPct = avgCost ? Math.round((1 - avgCost / MANUAL_BENCHMARK_USD) * 100) : 0;

  // Tendencia de time-to-fill por mes de contratación.
  const byMonth = new Map<string, { days: number[]; key: string }>();
  for (const h of hires) {
    const key = h.filledAt.slice(0, 7); // YYYY-MM
    if (!byMonth.has(key)) byMonth.set(key, { days: [], key });
    byMonth.get(key)!.days.push(daysBetween(h.openedAt, h.filledAt));
  }
  const trend = [...byMonth.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((m) => ({
      label: MONTHS[Number(m.key.slice(5, 7)) - 1],
      dias: Math.round(m.days.reduce((s, d) => s + d, 0) / m.days.length),
    }));

  // Desglose de costo agregado por categoría.
  const breakdown = [
    { label: 'IA (screening + entrevistas)', value: hires.reduce((s, h) => s + h.costBreakdown.ai, 0), color: 'bg-indigo-500' },
    { label: 'Horas de reclutador', value: hires.reduce((s, h) => s + h.costBreakdown.recruiter, 0), color: 'bg-violet-500' },
    { label: 'Publicación / fuentes', value: hires.reduce((s, h) => s + h.costBreakdown.advertising, 0), color: 'bg-amber-500' },
  ];
  const breakdownMax = Math.max(1, ...breakdown.map((b) => b.value));

  const recent = [...hires].sort((a, b) => b.filledAt.localeCompare(a.filledAt));

  return (
    <div>
      <PageHeader
        title="Métricas de contratación"
        subtitle="Costo por contratación y time-to-fill. La IA reduce tiempo y gasto en cada plaza cerrada."
      />

      {count === 0 ? (
        <Card className="p-12 text-center text-sm text-slate-400">
          Aún no hay contrataciones cerradas para esta empresa.
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Contrataciones" value={String(count)} icon={<TrendingDown className="h-5 w-5" />} />
            <StatCard label="Time-to-fill promedio" value={`${avgDays} días`} delta="vs. ~45 días manual" icon={<Clock className="h-5 w-5" />} />
            <StatCard label="Costo por contratación" value={fmtMoney(avgCost)} icon={<DollarSign className="h-5 w-5" />} />
            <StatCard label="Ahorro vs. proceso manual" value={fmtMoney(savingsTotal)} delta={`−${savingsPct}% por plaza`} icon={<PiggyBank className="h-5 w-5" />} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Tendencia time-to-fill */}
            <Card className="p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-bold text-slate-700">Time-to-fill por mes (días)</h2>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ stroke: '#c7d2fe' }} formatter={(v) => [`${v} días`, 'Time-to-fill']} />
                    <Line type="monotone" dataKey="dias" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Desglose de costo */}
            <Card className="p-5">
              <h2 className="mb-1 text-sm font-bold text-slate-700">Desglose de costo</h2>
              <p className="mb-4 text-xs text-slate-400">Total {fmtMoney(totalCost)} en {count} contrataciones</p>
              <div className="space-y-4">
                {breakdown.map((b) => (
                  <div key={b.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">{b.label}</span>
                      <span className="font-semibold text-slate-800">{fmtMoney(b.value)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${b.color}`} style={{ width: `${(b.value / breakdownMax) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-lg bg-indigo-50 px-3 py-2.5 text-xs text-indigo-700">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                La automatización con IA concentra el gasto en software, no en horas-hombre.
              </div>
            </Card>
          </div>

          {/* Tabla de contrataciones */}
          <Card className="mt-6 overflow-hidden">
            <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-bold text-slate-700">Contrataciones recientes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-3 font-semibold">Candidato</th>
                    <th className="px-6 py-3 font-semibold">Vacante</th>
                    <th className="px-6 py-3 font-semibold">Fuente</th>
                    <th className="px-6 py-3 font-semibold">Contratado</th>
                    <th className="px-6 py-3 text-right font-semibold">Time-to-fill</th>
                    <th className="px-6 py-3 text-right font-semibold">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((h) => {
                    const days = daysBetween(h.openedAt, h.filledAt);
                    return (
                      <tr key={h.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-6 py-3 font-semibold text-slate-800">{h.candidateName}</td>
                        <td className="px-6 py-3 text-slate-600">{jobs.find((j) => j.id === h.jobId)?.title ?? '—'}</td>
                        <td className="px-6 py-3"><Badge variant="slate">{h.source}</Badge></td>
                        <td className="px-6 py-3 text-slate-500">{h.filledAt}</td>
                        <td className="px-6 py-3 text-right">
                          <Badge variant={days <= 15 ? 'green' : days <= 25 ? 'amber' : 'red'}>{days} días</Badge>
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-slate-800">{fmtMoney(hireCost(h))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
