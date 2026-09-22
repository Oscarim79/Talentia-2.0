import { Link } from 'react-router-dom';
import { Puzzle, Settings } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { moduleDef, type ModuleId } from '../core/modules';
import { Card, PageHeader, Badge } from './ui/primitives';

/** Muestra la página solo si el módulo opcional está activo para la empresa. */
export function ModuleGate({ module, children }: { module: ModuleId; children: React.ReactNode }) {
  const { isModuleEnabled } = useSettings();
  if (isModuleEnabled(module)) return <>{children}</>;

  const def = moduleDef(module);
  return (
    <div>
      <PageHeader
        eyebrow="Módulo opcional"
        title={def.name}
        actions={<Badge variant="stone">Desactivado</Badge>}
      />
      <Card className="mx-auto max-w-xl p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Puzzle className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-stone-800">Este módulo no está activo para tu empresa.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">{def.description}</p>
        <Link
          to="/configuracion"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Settings className="h-4 w-4" /> Activar en Configuración
        </Link>
      </Card>
    </div>
  );
}
