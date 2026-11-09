import type { Candidate, CandidateStage } from '../types';

/**
 * Cambio de etapa por acción de RR.HH. Completa la línea de tiempo sin pisar
 * fechas que ya existían (alimenta las métricas de tiempos). Devuelve un objeto nuevo.
 */
export function applyStage(c: Candidate, stage: CandidateStage, today: string): Candidate {
  const timeline = { ...(c.timeline ?? {}) };
  let hiredAt = c.hiredAt;
  if (stage === 'offer') {
    timeline.offered ??= today;
    timeline.interviewed ??= today;
  } else if (stage === 'rejected') {
    timeline.rejected ??= today;
  } else if (stage === 'hired') {
    hiredAt ??= today;
  }
  return { ...c, stage, timeline, ...(hiredAt !== undefined ? { hiredAt } : {}) };
}

/** Marca la fecha de la primera respuesta enviada al candidato (solo la primera vez). */
export function applyReplied(c: Candidate, today: string): Candidate {
  const timeline = { ...(c.timeline ?? {}) };
  timeline.replied ??= today;
  return { ...c, timeline };
}
