import { ScanSearch, Clock, PiggyBank, UserCheck, ArrowRight } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { CANDIDATES, USAGE_EVENTS } from '../../data/seed';
import type { UsageType } from '../../types';
import { Card, PageHeader, StatCard, Badge } from '../../components/ui/primitives';

// ---- Supuestos de la comparación (editables; se muestran como nota al pie) ----
const MIN_POR_CV_MANUAL = 8; // min que un reclutador tarda revisando un CV a mano
const COSTO_HORA_RECLUTADOR = 5; // USD/hora (mercado GT, ~Q5.5k/mes)
const TIME_TO_FILL_INDUSTRIA = 36; // días promedio de la industria (benchmark)

const usd = (n: number, dec = 2) => `$${n.toFixed(dec)}`;

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

const COST_LABELS: Record<UsageType, string> = {
  screening: 'Screening de CVs',
  interview_min: 'Entrevistas IA',
  whatsapp_msg: 'Mensajes WhatsApp',
  llm_tokens: 'Tokens LLM',
};

export default function MetricsPage() {
  const { tenant } = useTenant();
  const { jobs: allJobs } = useJobs();
  const jobs = allJobs.filter((j) => j.tenantId === tenant.id);
  const cands = CANDIDATES.filter((c) => c.tenantId === tenant.id);
  const usage = USAGE_EVENTS.filter((u) => u.tenantId === tenant.id);

  // ---- Datos reales del demo ----
  const cvsAnalizados = usage.filter((u) => u.type === 'screening').reduce((s, u) => s + u.amount, 0);
  const costoIATotal = usage.reduce((s, u) => s + u.costUsd, 0);
  const costoIAScreening = usage.filter((u) => u.type === 'screening').reduce((s, u) => s + u.costUsd, 0);
  const hired = cands.filter((c) => c.stage === 'hired');
  const hires = hired.length;

  // ---- Métricas derivadas (con supuestos etiquetados) ----
  const horasAhorradas = (cvsAnalizados * MIN_POR_CV_MANUAL) / 60;
  const costoManualScreening = horasAhorradas * COSTO_HORA_RECLUTADOR;
  const ahorroScreening = costoManualScreening - costoIAScreening;
  const costoIAporCV = cvsAnalizados ? costoIAScreening / cvsAnalizados : 0;
  const costoManualPorCV = cvsAnalizados ? costoManualScreening / cvsAnalizados : 0;
  const cuantoMasBarato = costoIAporCV ? Math.round(costoManualPorCV / costoIAporCV) : 0;
  const costoPorContratacion = hires ? costoIATotal / hires : null;

  // time-to-fill: promedio de (hiredAt − job.createdAt) sobre contrataciones
  const ttf = hired
    .map((c) => {
      const job = jobs.find((j) => j.id === c.jobId);
      return job && c.hiredAt ? daysBetween(job.createdAt, c.hiredAt) : null;
    })
    .filter((v): v is number => v != null);
  const timeToFill = ttf.length ? Math.round(ttf.reduce((s, v) => s + v, 0) / ttf.length) : null;

  // ---- Desglose de costo IA por tipo ----
  const breakdown = (Object.keys(COST_LABELS) as UsageType[])
    .map((k) => ({
      label: COST_LABELS[k],
      value: usage.filter((u) => u.type === k).reduce((s, u) => s + u.costUsd, 0),
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  const maxCost = Math.max(...breakdown.map((r) => r.value), 0.01);

  // ---- Comparación "antes vs con Talentia" ----
  const comparison = [
    {
      metric: 'Tiempo de screening',
      manual: `≈ ${horasAhorradas.toFixed(0)} h`,
      ia: 'minutos',
      win: `${horasAhorradas.toFixed(0)} h ahorradas`,
    },
    {
      metric: 'Costo del screening',
      manual: usd(costoManualScreening),
      ia: usd(costoIAScreening),
      win: `${usd(ahorroScreening)} menos`,
    },
    {
      metric: 'Costo por CV',
      manual: usd(costoManualPorCV),
      ia: usd(costoIAporCV),
      win: `${cuantoMasBarato}× más barato`,
    },
    ...(timeToFill != null
      ? [
          {
            metric: 'Time-to-fill',
            manual: `${TIME_TO_FILL_INDUSTRIA} días`,
            ia: `${timeToFill} días`,
            win: `${TIME_TO_FILL_INDUSTRIA - timeToFill} días menos`,
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Métricas y ROI"
        subtitle="El retorno de automatizar el reclutamiento con IA — una persona gestiona cientos de candidatos."
      />

      {/* Tarjetas hero */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="CVs analizados por IA"
          value={cvsAnalizados.toLocaleString()}
          delta="por una sola persona"
          icon={<ScanSearch className="h-5 w-5" />}
        />
        <StatCard
          label="Horas ahorradas"
          value={`${horasAhorradas.toFixed(0)} h`}
          delta="vs revisión manual de CVs"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Ahorro vs proceso manual"
          value={usd(ahorroScreening, 0)}
          delta={`${cuantoMasBarato}× más barato por CV`}
          icon={<PiggyBank className="h-5 w-5" />}
        />
        <StatCard
          label="Costo IA por contratación"
          value={costoPorContratacion != null ? usd(costoPorContratacion) : '—'}
          delta="vs cientos de $ en la industria"
          icon={<UserCheck className="h-5 w-5" />}
        />
      </div>

      {/* Comparación antes vs con Talentia (el cierre para el CEO) */}
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-700">Proceso manual vs. con TALENTIA</h2>
          <p className="mt-0.5 text-xs text-slate-400">Sobre los {cvsAnalizados.toLocaleString()} CVs procesados en este periodo.</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-semibold">Métrica</th>
              <th className="px-6 py-3 font-semibold">Proceso manual</th>
              <th className="px-6 py-3 font-semibold text-indigo-600">Con TALENTIA</th>
              <th className="px-6 py-3 font-semibold text-right">Ventaja</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row) => (
              <tr key={row.metric} className="border-b border-slate-50 last:border-0">
                <td className="px-6 py-4 font-semibold text-slate-800">{row.metric}</td>
                <td className="px-6 py-4 text-slate-400 line-through decoration-slate-300">{row.manual}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-500" />
                    {row.ia}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Badge variant="green">{row.win}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Desglose de costo IA */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Costo IA por servicio</h2>
            <Badge variant="brand">{usd(costoIATotal)} total</Badge>
          </div>
          <div className="space-y-3">
            {breakdown.map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{r.label}</span>
                  <span className="font-semibold text-slate-700">{usd(r.value)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${(r.value / maxCost) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resumen del embudo */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700">Resultado del periodo</h2>
          <div className="grid grid-cols-2 gap-4">
            <MiniStat value={cands.length.toLocaleString()} label="Candidatos en pipeline" />
            <MiniStat value={String(hires)} label="Contrataciones" accent />
            <MiniStat value={timeToFill != null ? `${timeToFill} días` : '—'} label="Time-to-fill promedio" />
            <MiniStat value={usd(costoIAporCV)} label="Costo IA por CV" />
          </div>
          <p className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-xs text-indigo-900">
            Con TALENTIA, <b>una persona</b> filtró <b>{cvsAnalizados.toLocaleString()} CVs</b> por{' '}
            <b>{usd(costoIAScreening)}</b> — lo que a mano tomaría <b>≈{horasAhorradas.toFixed(0)} horas</b> de trabajo.
          </p>
        </Card>
      </div>

      {/* Nota de supuestos */}
      <p className="mt-5 text-[11px] leading-relaxed text-slate-400">
        Datos de demostración. Supuestos de la comparación: revisión manual ≈ {MIN_POR_CV_MANUAL} min/CV ·
        costo reclutador ≈ {usd(COSTO_HORA_RECLUTADOR, 0)}/hora · time-to-fill de industria ≈ {TIME_TO_FILL_INDUSTRIA} días.
        Los costos de IA provienen de los eventos de uso reales del periodo.
      </p>
    </div>
  );
}

function MiniStat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <p className={`text-2xl font-black ${accent ? 'text-green-600' : 'text-slate-900'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}
