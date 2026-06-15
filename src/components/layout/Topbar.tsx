import { ChevronDown, Sparkles } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Badge } from '../ui/primitives';

export function Topbar() {
  const { tenant, plan, tenants, setTenantId } = useTenant();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      {/* Selector de tenant (multi-tenant) */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Empresa
        </span>
        <div className="relative">
          <select
            value={tenant.id}
            onChange={(e) => setTenantId(e.target.value)}
            className="appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.logoEmoji}  {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        <span className="hidden text-xs text-slate-400 sm:inline">{tenant.industry}</span>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="amber">
          <Sparkles className="h-3 w-3" /> DEMO
        </Badge>
        <Badge variant="brand">Plan {plan.name}</Badge>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
          {tenant.logoEmoji}
        </div>
      </div>
    </header>
  );
}
