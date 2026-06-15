import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { TENANTS, PLANS, CANDIDATES, USAGE_EVENTS } from '../../data/seed';
import { Card, PageHeader, Badge, ProgressBar } from '../../components/ui/primitives';
import { fmtMoney } from '../../lib/utils';
import { DEMO_MODE, SUPABASE, SUPABASE_CONFIGURED } from '../../core/config';
import { checkSupabaseConnection } from '../../core/supabase';

export default function AdminPage() {
  const { tenant, plan } = useTenant();
  const { jobs: allJobs } = useJobs();

  const jobsUsed = allJobs.filter((j) => j.tenantId === tenant.id).length;
  const candsUsed = CANDIDATES.filter((c) => c.tenantId === tenant.id).length;
  const screeningUsed = USAGE_EVENTS.filter((u) => u.tenantId === tenant.id && u.type === 'screening').reduce((s, u) => s + u.amount, 0);

  return (
    <div>
      <PageHeader title="Administración" subtitle="Consola multi-tenant: planes, créditos y consumo." />

      <SupabaseStatusCard />


      {/* Uso del plan actual */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">
            Uso de {tenant.name} · Plan <span className="text-indigo-600">{plan.name}</span>
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
        <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-bold text-slate-700">
          Empresas (tenants)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
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
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3 font-semibold text-slate-800">
                    {t.logoEmoji} {t.name}
                  </td>
                  <td className="px-6 py-3 text-slate-500">{t.industry}</td>
                  <td className="px-6 py-3">
                    <Badge variant="brand">{p?.name}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={t.status === 'active' ? 'green' : t.status === 'trial' ? 'amber' : 'red'}>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{nJobs}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Planes */}
      <h2 className="mb-3 text-sm font-bold text-slate-700">Planes y créditos</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => (
          <Card key={p.id} className={`p-5 ${p.id === plan.id ? 'ring-2 ring-indigo-500' : ''}`}>
            <p className="text-sm font-bold text-slate-800">{p.name}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {fmtMoney(p.monthlyPriceUsd)}
              <span className="text-sm font-medium text-slate-400">/mes</span>
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
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

function SupabaseStatusCard() {
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    checkSupabaseConnection().then(setReachable);
  }, []);

  const projectRef = SUPABASE.url.replace(/^https?:\/\//, '').split('.')[0];

  return (
    <Card className="mb-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Persistencia · Supabase</p>
            <p className="text-xs text-slate-500">
              {SUPABASE_CONFIGURED ? <>Proyecto <span className="font-mono">{projectRef}</span></> : 'Sin configurar'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {SUPABASE_CONFIGURED ? (
            <Badge variant={reachable === false ? 'red' : 'green'}>
              {reachable === null ? 'Verificando…' : reachable ? 'Conectado' : 'Sin acceso'}
            </Badge>
          ) : (
            <Badge variant="slate">No configurado</Badge>
          )}
          <Badge variant={DEMO_MODE ? 'amber' : 'brand'}>
            {DEMO_MODE ? 'Datos demo' : 'Datos reales'}
          </Badge>
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Cliente conectado. Falta aplicar el schema (<span className="font-mono">supabase/migrations/0001_init.sql</span>)
        y revisar las políticas RLS antes de mover los datos de demo a la base real.
      </p>
    </Card>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit ? Math.round((used / limit) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="text-slate-400">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <ProgressBar value={pct} />
    </div>
  );
}
