import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { TENANTS, PLANS, CANDIDATES, USAGE_EVENTS } from '../../data/seed';
import { Card, PageHeader, Badge, ProgressBar } from '../../components/ui/primitives';
import { fmtMoney } from '../../lib/utils';

export default function AdminPage() {
  const { tenant, plan } = useTenant();
  const { jobs: allJobs } = useJobs();

  const jobsUsed = allJobs.filter((j) => j.tenantId === tenant.id).length;
  const candsUsed = CANDIDATES.filter((c) => c.tenantId === tenant.id).length;
  const screeningUsed = USAGE_EVENTS.filter((u) => u.tenantId === tenant.id && u.type === 'screening').reduce((s, u) => s + u.amount, 0);

  return (
    <div>
      <PageHeader eyebrow="Gestión" title="Administración" subtitle="Consola multi-tenant: planes, créditos y consumo." />

      {/* Uso del plan actual */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-700">
            Uso de {tenant.name} · Plan <span className="text-brand-600">{plan.name}</span>
          </h2>
          <Badge variant="brand">{fmtMoney(plan.monthlyPriceUsd)}/mes</Badge>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <UsageMeter label="Vacantes" used={jobsUsed} limit={plan.limits.maxJobs} />
          <UsageMeter label="Candidatos" used={candsUsed} limit={plan.limits.maxCandidates} />
          <UsageMeter label="Créditos de screening" used={screeningUsed} limit={plan.limits.screeningCredits} />
        </div>
      </Card>

      {/* Empresas (super-admin) */}
      <Card className="mb-6 overflow-hidden">
        <h2 className="border-b border-stone-100 px-6 py-4 text-sm font-bold text-stone-700">
          Empresas (tenants)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400">
              <th className="px-6 py-3 font-semibold">Empresa</th>
              <th className="px-6 py-3 font-semibold">Industria</th>
              <th className="px-6 py-3 font-semibold">Plan</th>
              <th className="px-6 py-3 font-semibold">Estado</th>
              <th className="px-6 py-3 font-semibold">Vacantes</th>
            </tr>
          </thead>
          <tbody>
            {TENANTS.map((t) => {
              const p = PLANS.find((pl) => pl.id === t.planId);
              const nJobs = allJobs.filter((j) => j.tenantId === t.id).length;
              return (
                <tr key={t.id} className="border-b border-stone-50 last:border-0">
                  <td className="px-6 py-3 font-semibold text-stone-800">
                    {t.logoEmoji} {t.name}
                  </td>
                  <td className="px-6 py-3 text-stone-500">{t.industry}</td>
                  <td className="px-6 py-3">
                    <Badge variant="brand">{p?.name}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={t.status === 'active' ? 'green' : t.status === 'trial' ? 'amber' : 'red'}>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-stone-600">{nJobs}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Planes */}
      <h2 className="mb-3 text-sm font-bold text-stone-700">Planes y créditos</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => (
          <Card key={p.id} className={`p-5 ${p.id === plan.id ? 'ring-2 ring-brand-500' : ''}`}>
            <p className="text-sm font-bold text-stone-800">{p.name}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-stone-900">
              {fmtMoney(p.monthlyPriceUsd)}
              <span className="text-sm font-medium text-stone-400">/mes</span>
            </p>
            <ul className="mt-3 space-y-1 text-xs text-stone-500">
              <li>{p.limits.maxJobs} vacantes</li>
              <li>{p.limits.maxCandidates.toLocaleString()} candidatos</li>
              <li>{p.limits.screeningCredits.toLocaleString()} créditos screening</li>
              <li>{p.limits.interviewMinutes.toLocaleString()} min de entrevista</li>
              <li>{p.limits.seats} usuarios</li>
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit ? Math.round((used / limit) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-stone-600">{label}</span>
        <span className="text-stone-400">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <ProgressBar value={pct} tone="brand" />
    </div>
  );
}
