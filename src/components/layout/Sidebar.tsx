import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  ScanSearch,
  Users,
  MessagesSquare,
  Grid3x3,
  ClipboardCheck,
  TrendingUp,
  Shield,
  Settings,
  MailCheck,
  X,
} from 'lucide-react';
import { APP } from '../../core/config';
import { cn } from '../../lib/utils';
import { useSettings } from '../../context/SettingsContext';
import type { ModuleId } from '../../core/modules';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  /** Solo se muestra si el módulo opcional está activo para la empresa. */
  module?: ModuleId;
};

const groups: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Reclutamiento',
    items: [
      { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
      { to: '/screening', label: 'Screening IA', icon: ScanSearch },
      { to: '/candidatos', label: 'Candidatos', icon: Users },
      { to: '/respuestas', label: 'Respuestas a CVs', icon: MailCheck },
      { to: '/entrevistas', label: 'Entrevistas IA', icon: MessagesSquare, module: 'interviewsAi' },
    ],
  },
  {
    label: 'Talento',
    items: [
      { to: '/talento', label: 'Matriz 9-Box', icon: Grid3x3 },
      { to: '/acciones', label: 'Acciones RR.HH.', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/metricas', label: 'Métricas RR.HH.', icon: TrendingUp },
      { to: '/configuracion', label: 'Configuración', icon: Settings },
      { to: '/admin', label: 'Admin', icon: Shield },
    ],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { isModuleEnabled } = useSettings();
  const visibleGroups = groups.map((g) => ({
    ...g,
    items: g.items.filter((it) => !it.module || isModuleEnabled(it.module)),
  }));
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-brand-950 text-brand-100">
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 font-display text-lg font-bold text-brand-950 shadow-[0_2px_8px_rgba(201,144,67,0.4)]">
          T
        </div>
        <div className="flex-1">
          <p className="font-display text-[15px] font-semibold leading-tight tracking-wide text-white">
            {APP.name} <span className="text-gold-400">{APP.version}</span>
          </p>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-brand-300">
            Reclutamiento con IA
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 text-brand-300 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {visibleGroups.map((g) => (
          <div key={g.label ?? 'main'} className="mb-1">
            {g.label && (
              <p className="mb-1 mt-4 px-3 font-mono text-[9.5px] font-medium uppercase tracking-[0.22em] text-brand-400/80">
                {g.label}
              </p>
            )}
            <div className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  data-tour={`nav:${to}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-white shadow-[inset_2px_0_0_0_var(--color-gold-500)]'
                        : 'text-brand-200/80 hover:bg-white/5 hover:text-white',
                    )
                  }
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] leading-relaxed text-brand-200">
          <p className="font-semibold text-gold-300">Modo demostración</p>
          <p className="mt-0.5 text-brand-300">Sin proveedores conectados. IA simulada.</p>
        </div>
      </div>
    </aside>
  );
}
