import { useTenant } from '../../context/TenantContext';
import { CANDIDATES } from '../../data/seed';
import { Card, PageHeader, Badge, scoreVariant } from '../../components/ui/primitives';
import type { CandidateStage } from '../../types';

const COLUMNS: { key: CandidateStage; label: string }[] = [
  { key: 'applied', label: 'Aplicados' },
  { key: 'screening', label: 'Screening' },
  { key: 'interview', label: 'Entrevista' },
  { key: 'offer', label: 'Oferta' },
  { key: 'hired', label: 'Contratados' },
  { key: 'rejected', label: 'Descartados' },
];

export default function CandidatesPage() {
  const { tenant } = useTenant();
  const cands = CANDIDATES.filter((c) => c.tenantId === tenant.id);

  return (
    <div>
      <PageHeader eyebrow="Reclutamiento" title="Candidatos" subtitle="Pipeline post-screening: cada candidato en su etapa." />

      {cands.length === 0 ? (
        <Card className="p-12 text-center text-sm text-stone-400">
          Sin candidatos para esta empresa todavía.
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const items = cands.filter((c) => c.stage === col.key);
            return (
              <div key={col.key} className="w-64 shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{col.label}</span>
                  <Badge variant="stone">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <Card key={c.id} className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                          {c.firstName[0]}
                          {c.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-stone-800">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="truncate text-[11px] text-stone-400">{c.source}</p>
                        </div>
                        {c.screeningScore != null && (
                          <Badge variant={scoreVariant(c.screeningScore)}>{c.screeningScore}</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-lg border border-dashed border-stone-200 py-6 text-center text-[11px] text-stone-300">
                      vacío
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
