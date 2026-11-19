import type { CandidateStage } from '../../types';

/** Etapas del embudo, en orden. "Descartados" no es una etapa: quienes se descartan solo cuentan como aplicados. */
export const FUNNEL_STAGES: { key: Exclude<CandidateStage, 'rejected'>; label: string }[] = [
  { key: 'applied', label: 'Aplicados' },
  { key: 'screening', label: 'Screening' },
  { key: 'interview', label: 'Entrevista' },
  { key: 'offer', label: 'Oferta' },
  { key: 'hired', label: 'Contratado' },
];

export interface FunnelStage {
  key: Exclude<CandidateStage, 'rejected'>;
  label: string;
  /** Candidatos que llegaron a esta etapa o más allá. */
  reached: number;
  /** % respecto a la etapa anterior (null en la primera o si la anterior está vacía). */
  pct: number | null;
}

export interface FunnelDrop {
  from: string;
  to: string;
  /** % que se perdió entre las dos etapas. */
  lossPct: number;
}

/** Embudo acumulado a partir del conteo de candidatos por etapa actual. */
export function buildFunnel(counts: Partial<Record<CandidateStage, number>>): { stages: FunnelStage[]; biggestDrop: FunnelDrop | null } {
  const keys = FUNNEL_STAGES.map((s) => s.key);
  const stages: FunnelStage[] = FUNNEL_STAGES.map((s, i) => {
    const later = keys.slice(i).reduce((sum, k) => sum + (counts[k] ?? 0), 0);
    return { ...s, reached: later + (i === 0 ? (counts.rejected ?? 0) : 0), pct: null };
  });

  let biggestDrop: FunnelDrop | null = null;
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1].reached;
    if (prev === 0) continue;
    const pct = Math.round((stages[i].reached / prev) * 100);
    stages[i].pct = pct;
    const loss = 100 - pct;
    if (loss > 0 && loss > (biggestDrop?.lossPct ?? 0)) {
      biggestDrop = { from: stages[i - 1].label, to: stages[i].label, lossPct: loss };
    }
  }
  return { stages, biggestDrop };
}
