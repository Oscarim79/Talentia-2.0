import { Briefcase, Users, ScanSearch, DollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { CANDIDATES, USAGE_EVENTS } from '../../data/seed';
import { Card, PageHeader, StatCard, Badge, ProgressBar } from '../../components/ui/primitives';
import { fmtMoney } from '../../lib/utils';
import { scoreVariant } from '../../components/ui/primitives';

const STAGES: { key: string; label: string; color: string }[] = [
  { key: 'applied', label: 'Aplicados', color: '#d6d3d1' },
  { key: 'screening', label: 'Screening', color: '#7cc4a6' },
  { key: 'interview', label: 'Entrevista', color: '#1f8a66' },
  { key: 'offer', label: 'Oferta', color: '#c99043' },
  { key: 'hired', label: 'Contratado', color: '#0c5b44' },
];

export default function DashboardPage() {
  const { tenant } = useTenant();
  const { jobs: allJobs } = useJobs();
  const jobs = allJobs.filter((j) => j.tenantId === tenant.id);
  const cands = CANDIDATES.filter((c) => c.tenantId === tenant.id);
  const usage = USAGE_EVENTS.filter((u) => u.tenantId === tenant.id);

  const openJobs = jobs.filter((j) => j.status === 'open').length;
  const screeningUsed = usage.filter((u) => u.type === 'screening').reduce((s, u) => s + u.amount, 0);
  const totalCost = usage.reduce((s, u) => s + u.costUsd, 0);

  const funnel = STAGES.map((s) => ({
    label: s.label,
    color: s.color,
    value: cands.filter((c) => c.stage === s.key).length,
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
        <StatCard label="Costo IA acumulado" value={fmtMoney(totalCost)} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-bold text-stone-700">Funnel de reclutamiento</h2>
          {cands.length === 0 ? (
            <EmptyState text="Aún no hay candidatos para esta empresa. Ve a Screening IA para cargar CVs." />
          ) : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#78716c' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#78716c' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 13 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {funnel.map((f) => (
                      <Cell key={f.label} fill={f.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-stone-700">Mejores candidatos (IA)</h2>
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
                    <p className="truncate text-sm font-semibold text-stone-800">
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
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-stone-200 px-6 text-center text-sm text-stone-400">
      {text}
    </div>
  );
}
