import { Link } from 'react-router-dom';
import { NotebookPen } from 'lucide-react';
import { useCandidates } from '../../context/CandidatesContext';
import { useEvaluations } from '../../context/EvaluationsContext';
import { Card, PageHeader, Badge, scoreVariant } from '../../components/ui/primitives';
import { CvLink } from '../../components/CvLink';
import { RECOMMENDATION_LABEL, fmt1, scoreEvaluation, type RecommendationLevel } from '../../core/interviewGuide';
import { OfferActions } from './OfferActions';
import type { Candidate, CandidateStage } from '../../types';

const LEVEL_BADGE: Record<RecommendationLevel, 'green' | 'amber' | 'red'> = { recommended: 'green', reservations: 'amber', not: 'red' };

const COLUMNS: { key: CandidateStage; label: string }[] = [
  { key: 'applied', label: 'Aplicados' },
  { key: 'screening', label: 'Screening' },
  { key: 'interview', label: 'Entrevista' },
  { key: 'offer', label: 'Oferta' },
  { key: 'hired', label: 'Contratados' },
  { key: 'rejected', label: 'Descartados' },
];

export default function CandidatesPage() {
  const { candidates: cands, setStage } = useCandidates();
  const { evaluations } = useEvaluations();

  /** Resultado de la Entrevista por competencias en la tarjeta (o el acceso para hacerla). */
  function interviewLine(c: Candidate) {
    const ev = evaluations[c.id];
    if (!ev && c.stage !== 'interview') return null;
    const r = ev ? scoreEvaluation(ev) : null;
    return (
      <Link
        to={`/competencias?c=${c.id}`}
        className="mt-2 flex items-center gap-1.5 border-t border-neutral-100 pt-2 text-xs font-semibold text-brand-700 hover:text-brand-900"
      >
        <NotebookPen className="h-3.5 w-3.5 shrink-0" />
        {r?.index != null && r.level ? (
          <Badge variant={LEVEL_BADGE[r.level]} className="px-2 text-xs">
            {fmt1(r.index)} · {RECOMMENDATION_LABEL[r.level]}
          </Badge>
        ) : ev ? (
          'Entrevista en curso'
        ) : (
          'Evaluar entrevista'
        )}
      </Link>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reclutamiento"
        title="Candidatos"
        subtitle="Pipeline post-screening: cada candidato en su etapa, con el score del CV y el resultado de su entrevista por competencias."
      />

      {cands.length === 0 ? (
        <Card className="p-12 text-center text-sm text-neutral-500">
          Sin candidatos para esta empresa todavía.
        </Card>
      ) : (
        <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:overflow-x-auto" data-tour="candidates:board">
          {COLUMNS.map((col) => {
            const items = cands.filter((c) => c.stage === col.key);
            return (
              <div key={col.key} className="w-full shrink-0 sm:w-64">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">{col.label}</span>
                  <Badge variant="stone">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <Card key={c.id} className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {c.firstName[0]}
                          {c.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-800">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="truncate text-xs text-neutral-500">{c.source}</p>
                        </div>
                        {c.screeningScore != null && (
                          <Badge variant={scoreVariant(c.screeningScore)}>{c.screeningScore}</Badge>
                        )}
                      </div>
                      {c.cvPath && (
                        <div className="mt-2">
                          <CvLink cvPath={c.cvPath} />
                        </div>
                      )}
                      {interviewLine(c)}
                      {/* En Oferta: cerrar la oferta desde la misma tarjeta (aceptó → Contratados; no aceptó → Descartados). */}
                      <OfferActions candidate={c} onStage={(stage) => setStage(c.id, stage)} className="mt-2 border-t border-neutral-100 pt-2" />
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-lg border border-dashed border-neutral-200 py-6 text-center text-xs text-neutral-500">
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
