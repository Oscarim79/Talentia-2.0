import { UserCheck, XCircle } from 'lucide-react';
import { useConfirm, type ConfirmOptions } from '../../components/ui/ConfirmDialog';
import { Button } from '../../components/ui/primitives';
import { notifySuccess } from '../../lib/notify';
import { cn } from '../../lib/utils';
import type { Candidate, CandidateStage } from '../../types';

/** Qué pasó con la oferta: la aceptó (→ Contratado) o no (→ Descartado). */
export type OfferOutcome = 'hired' | 'declined';

export interface OfferDecision {
  stage: CandidateStage;
  confirm: ConfirmOptions;
  /** Aviso verde al terminar. */
  notice: string;
}

/** Etapa destino y textos de la confirmación para cada desenlace de la oferta. */
export function offerDecision(outcome: OfferOutcome, name: string): OfferDecision {
  if (outcome === 'hired') {
    return {
      stage: 'hired',
      confirm: {
        title: `¿Marcar a ${name} como contratado?`,
        message:
          'Pasa a la columna Contratados con la fecha de hoy como fecha de contratación; de ahí salen el time-to-hire y las plazas cubiertas en Métricas. Si te equivocas, desde su reporte en Entrevistas puedes regresarlo a Oferta.',
        confirmLabel: 'Sí, contratado',
      },
      notice: `${name} pasó a Contratados.`,
    };
  }
  return {
    stage: 'rejected',
    confirm: {
      title: `¿${name} no aceptó la oferta?`,
      message:
        'Pasa a Descartados y el proceso con esta persona se cierra. Si te equivocas, desde su reporte en Entrevistas puedes regresarlo a Entrevista.',
      confirmLabel: 'Sí, no aceptó',
      tone: 'danger',
    },
    notice: `${name} pasó a Descartados.`,
  };
}

/**
 * Botones para cerrar la oferta de un candidato que está en la etapa Oferta:
 * "Marcar como contratado" y "No aceptó la oferta". En cualquier otra etapa no pinta nada.
 */
export function OfferActions({
  candidate,
  onStage,
  className,
}: {
  candidate: Candidate;
  onStage: (stage: CandidateStage) => void;
  className?: string;
}) {
  const confirm = useConfirm();
  if (candidate.stage !== 'offer') return null;
  const name = `${candidate.firstName} ${candidate.lastName}`;

  async function choose(outcome: OfferOutcome) {
    const d = offerDecision(outcome, name);
    if (!(await confirm(d.confirm))) return;
    onStage(d.stage);
    notifySuccess(d.notice);
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button onClick={() => choose('hired')}>
        <UserCheck className="h-4 w-4" /> Marcar como contratado
      </Button>
      <Button variant="secondary" onClick={() => choose('declined')}>
        <XCircle className="h-4 w-4" /> No aceptó la oferta
      </Button>
    </div>
  );
}
