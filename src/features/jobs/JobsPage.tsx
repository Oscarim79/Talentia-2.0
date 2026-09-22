import { useState } from 'react';
import { Plus, MapPin, Users2, Link2, Sparkles, Download } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { Card, PageHeader, Badge, Button } from '../../components/ui/primitives';
import { fmtMoney, downloadTextFile, slugify } from '../../lib/utils';
import { jobToLinkedInXml } from '../../lib/linkedin';
import JobWizard from './JobWizard';
import type { Job, JobStatus } from '../../types';

const STATUS_VARIANT: Record<JobStatus, 'green' | 'amber' | 'stone' | 'red'> = {
  open: 'green',
  draft: 'stone',
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
  const { jobs: allJobs, addJob } = useJobs();
  const jobs = allJobs.filter((j) => j.tenantId === tenant.id);
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="Reclutamiento"
        title="Vacantes"
        subtitle="Crea vacantes con IA: descripción, preguntas y link de postulación."
        actions={
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva vacante
          </Button>
        }
      />

      {jobs.length === 0 ? (
        <Card className="p-12 text-center text-sm text-stone-400">Esta empresa aún no tiene vacantes.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}

      {wizardOpen && <JobWizard onClose={() => setWizardOpen(false)} onCreate={addJob} />}
    </div>
  );
}

function JobCard({ job: j }: { job: Job }) {
  const { tenant } = useTenant();
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-stone-900">{j.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
            <Badge variant="gold">{j.brand}</Badge>
            <span>{j.department}</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {j.location}
            </span>
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[j.status]}>{STATUS_LABEL[j.status]}</Badge>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-stone-600">{j.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="stone">{fmtMoney(j.salaryMin, 'GTQ')}–{fmtMoney(j.salaryMax, 'GTQ')}</Badge>
        <Badge variant="brand">
          <Users2 className="h-3 w-3" /> {j.openings} plazas
        </Badge>
        <Badge variant="blue">
          <Sparkles className="h-3 w-3" /> {j.questions.length} preguntas IA
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
          <Link2 className="h-3.5 w-3.5" />
          talentia.app/{j.applySlug}
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            downloadTextFile(`linkedin_${slugify(j.title)}.xml`, jobToLinkedInXml(j, tenant), 'application/xml')
          }
        >
          <Download className="h-4 w-4" /> XML
        </Button>
      </div>
    </Card>
  );
}
