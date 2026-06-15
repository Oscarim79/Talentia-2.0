import { Plus, MapPin, Users2, Link2, Sparkles } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { JOBS } from '../../data/seed';
import { Card, PageHeader, Badge, Button } from '../../components/ui/primitives';
import { fmtMoney } from '../../lib/utils';
import type { JobStatus } from '../../types';

const STATUS_VARIANT: Record<JobStatus, 'green' | 'amber' | 'slate' | 'red'> = {
  open: 'green',
  draft: 'slate',
  paused: 'amber',
  closed: 'red',
};
const STATUS_LABEL: Record<JobStatus, string> = {
  open: 'Abierta',
  draft: 'Borrador',
  paused: 'Pausada',
  closed: 'Cerrada',
};

export default function JobsPage() {
  const { tenant } = useTenant();
  const jobs = JOBS.filter((j) => j.tenantId === tenant.id);

  return (
    <div>
      <PageHeader
        title="Vacantes"
        subtitle="Crea vacantes con IA: descripción, preguntas y link de postulación."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Nueva vacante
          </Button>
        }
      />

      {jobs.length === 0 ? (
        <Card className="p-12 text-center text-sm text-slate-400">Esta empresa aún no tiene vacantes.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {jobs.map((j) => (
            <Card key={j.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{j.title}</h3>
                  <p className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span>{j.department}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {j.location}
                    </span>
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[j.status]}>{STATUS_LABEL[j.status]}</Badge>
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{j.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="slate">{fmtMoney(j.salaryMin, 'GTQ')}–{fmtMoney(j.salaryMax, 'GTQ')}</Badge>
                <Badge variant="brand">
                  <Users2 className="h-3 w-3" /> {j.openings} plazas
                </Badge>
                <Badge variant="blue">
                  <Sparkles className="h-3 w-3" /> {j.questions.length} preguntas IA
                </Badge>
              </div>

              <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <Link2 className="h-3.5 w-3.5" />
                talentia.app/{j.applySlug}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
