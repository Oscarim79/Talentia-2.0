import { Link } from 'react-router-dom';
import { Puzzle, Lock, ArrowUpRight } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useSettings } from '../../context/SettingsContext';
import { MODULES } from '../../core/modules';
import { Card, PageHeader, Badge } from '../../components/ui/primitives';
import { cn } from '../../lib/utils';

export default function SettingsPage() {
  const { tenant } = useTenant();
  const { isModuleEnabled, setModuleEnabled } = useSettings();

  return (
    <div>
      <PageHeader
        eyebrow="Gestión"
        title="Configuración"
        subtitle={`Módulos opcionales de ${tenant.name}. Se encienden o apagan; no se configuran.`}
      />

      <Card className="mb-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-stone-100 px-6 py-4">
          <Puzzle className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-bold text-stone-700">Módulos opcionales</h2>
        </div>
        <ul className="divide-y divide-stone-100">
          {MODULES.map((m) => {
            const on = isModuleEnabled(m.id);
            return (
              <li key={m.id} className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-stone-800">{m.name}</p>
                    <Badge variant={on ? 'green' : 'stone'}>{on ? 'Activo' : 'Desactivado'}</Badge>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-stone-500">{m.description}</p>
                  <p className="mt-2 text-xs text-stone-400">Al activarlo: {m.unlocks}</p>
                  {on && (
                    <Link
                      to={m.route}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Abrir {m.name} <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
                <Toggle checked={on} onChange={(v) => setModuleEnabled(m.id, v)} label={`Activar ${m.name}`} />
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-stone-100 p-2 text-stone-500">
            <Lock className="h-4 w-4" />
          </div>
          <div className="text-sm text-stone-600">
            <p className="font-semibold text-stone-800">Software opinado</p>
            <p className="mt-1 text-stone-500">
              TALENTIA no tiene pantallas de configuración flexible: el proceso de reclutamiento ya viene
              definido y la empresa se adapta a él. Los datos entran por plantillas estándar (Colaboradores,
              KPIs de Desempeño y Cultura 360°). Aquí solo se decide qué módulos opcionales están encendidos.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        checked ? 'bg-brand-600' : 'bg-stone-300',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}
