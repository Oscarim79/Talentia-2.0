import { ChevronDown, Menu, Sparkles } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Badge } from '../ui/primitives';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { tenant, plan, tenants, setTenantId } = useTenant();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-stone-200/80 bg-canvas px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label="Abrir menú"
            className="rounded-lg border border-stone-300 bg-white p-2 text-stone-600 hover:bg-stone-50 lg:hidden"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        )}
        <span className="hidden font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400 sm:inline">
          Empresa
        </span>
        <div className="relative">
          <select
            value={tenant.id}
            onChange={(e) => setTenantId(e.target.value)}
            className="appearance-none rounded-lg border border-stone-300 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-stone-800 hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.logoEmoji}  {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        </div>
        <span className="hidden truncate text-xs text-stone-400 md:inline">{tenant.industry}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Badge variant="gold">
          <Sparkles className="h-3 w-3" /> DEMO
        </Badge>
        <Badge variant="brand" className="hidden sm:inline-flex">
          Plan {plan.name}
        </Badge>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">
          {tenant.logoEmoji}
        </div>
      </div>
    </header>
  );
}
