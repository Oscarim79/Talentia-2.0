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
} from 'lucide-react';
import { APP } from '../../core/config';
import { cn } from '../../lib/utils';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
  { to: '/screening', label: 'Screening IA', icon: ScanSearch },
  { to: '/candidatos', label: 'Candidatos', icon: Users },
  { to: '/entrevistas', label: 'Entrevistas IA', icon: MessagesSquare },
  { to: '/talento', label: 'Talento · 9-Box', icon: Grid3x3 },
  { to: '/acciones', label: 'Acciones RR.HH.', icon: ClipboardCheck },
  { to: '/metricas', label: 'Métricas · ROI', icon: TrendingUp },
  { to: '/admin', label: 'Admin', icon: Shield },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
          T
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">
            {APP.name} <span className="text-indigo-600">{APP.version}</span>
          </p>
          <p className="text-[10px] font-medium text-slate-400">Reclutamiento con IA</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4">
        <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700">Modo demostración</p>
          <p className="mt-0.5">Sin proveedores conectados. IA simulada.</p>
        </div>
      </div>
    </aside>
  );
}
