// ============================================================
//  Métricas operativas de RR.HH. — cuánto tarda cada quien en hacer lo suyo.
//  Funciones puras sobre candidatos, vacantes y usuarios (sin React).
// ============================================================
import type { Candidate, Job, User } from '../../types';

/** Metas de servicio en días. Editables por empresa en Configuración; estos son los valores de fábrica. */
export interface SlaGoals {
  review: number; // revisar el CV desde que llega
  reply: number; // responder al candidato desde que se revisó
  interview: number; // entrevistar desde que se le respondió
  decide: number; // decidir (oferta o descarte) desde la entrevista
  close: number; // cerrar la oferta (contratar) desde que se envió
}

export const DEFAULT_SLA: SlaGoals = { review: 2, reply: 1, interview: 5, decide: 3, close: 5 };

export const SLA_LABELS: Record<keyof SlaGoals, { label: string; help: string }> = {
  review: { label: 'Revisar el CV', help: 'desde que llega el CV' },
  reply: { label: 'Responder al candidato', help: 'desde que se revisó el CV' },
  interview: { label: 'Entrevistar', help: 'desde que se le respondió' },
  decide: { label: 'Decidir tras la entrevista', help: 'oferta o descarte' },
  close: { label: 'Cerrar la oferta', help: 'desde que se envió la oferta' },
};

export function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}

function avg(xs: number[]): number | null {
  return xs.length ? Math.round((xs.reduce((s, v) => s + v, 0) / xs.length) * 10) / 10 : null;
}

function pct(part: number, total: number): number | null {
  return total ? Math.round((part / total) * 100) : null;
}

/** Fecha de cierre de la entrevista: oferta o descarte posterior a la entrevista. */
function decidedAt(c: Candidate): string | undefined {
  const t = c.timeline;
  if (!t?.interviewed) return undefined;
  return t.offered ?? (t.rejected && t.rejected >= t.interviewed ? t.rejected : undefined);
}

// ---------- Tiempos por etapa ----------
export interface StageTime {
  key: keyof SlaGoals;
  label: string;
  /** Promedio en días (null si no hay casos). */
  avg: number | null;
  n: number;
  sla: number;
  /** % de casos dentro de la meta. */
  onTime: number | null;
}

/** Duraciones por transición para un conjunto de candidatos. */
export function stageTimes(cands: Candidate[], sla: SlaGoals): StageTime[] {
  const dur = (from: (c: Candidate) => string | undefined, to: (c: Candidate) => string | undefined) =>
    cands
      .map((c) => {
        const a = from(c);
        const b = to(c);
        return a && b ? daysBetween(a, b) : null;
      })
      .filter((v): v is number => v != null);

  const defs: { key: keyof SlaGoals; label: string; xs: number[] }[] = [
    { key: 'review', label: 'Revisar el CV', xs: dur((c) => c.appliedAt, (c) => c.timeline?.screened) },
    { key: 'reply', label: 'Responder al candidato', xs: dur((c) => c.timeline?.screened, (c) => c.timeline?.replied) },
    { key: 'interview', label: 'Entrevistar', xs: dur((c) => c.timeline?.replied, (c) => c.timeline?.interviewed) },
    { key: 'decide', label: 'Decidir tras la entrevista', xs: dur((c) => c.timeline?.interviewed, decidedAt) },
    { key: 'close', label: 'Cerrar la oferta', xs: dur((c) => c.timeline?.offered, (c) => c.hiredAt) },
  ];
  return defs.map((d) => ({
    key: d.key,
    label: d.label,
    avg: avg(d.xs),
    n: d.xs.length,
    sla: sla[d.key],
    onTime: pct(d.xs.filter((v) => v <= sla[d.key]).length, d.xs.length),
  }));
}

// ---------- Por persona ----------
export interface RecruiterStats {
  user: User;
  assigned: number;
  active: number; // en proceso (ni contratado ni descartado)
  reviewed: number;
  pendingReview: number;
  avgReview: number | null;
  reviewOnTime: number | null;
  replied: number;
  pendingReply: number;
  avgReply: number | null;
  replyOnTime: number | null;
  interviews: number;
  avgToInterview: number | null;
  offers: number;
  hires: number;
  rejected: number;
  avgTimeToHire: number | null;
  /** Días promedio de espera de sus pendientes (revisión + respuesta). */
  avgWaiting: number | null;
}

export function recruiterStats(cands: Candidate[], users: User[], now: string, sla: SlaGoals): RecruiterStats[] {
  return users
    .map((user) => {
      const mine = cands.filter((c) => c.ownerId === user.id);
      const readable = mine.filter((c) => c.screeningStatus !== 'error');
      const reviewedList = readable.filter((c) => c.timeline?.screened);
      const pendingReviewList = readable.filter((c) => !c.timeline?.screened);
      const repliedList = mine.filter((c) => c.timeline?.replied);
      // Pendiente de respuesta: revisado, no descartado y sin respuesta enviada.
      const pendingReplyList = mine.filter(
        (c) => c.timeline?.screened && !c.timeline?.replied && !c.timeline?.rejected && c.stage !== 'rejected',
      );
      const reviewDays = reviewedList.map((c) => daysBetween(c.appliedAt, c.timeline!.screened!));
      const replyDays = repliedList.map((c) => daysBetween(c.timeline!.screened!, c.timeline!.replied!));
      const interviewList = mine.filter((c) => c.timeline?.interviewed);
      const toInterview = interviewList
        .filter((c) => c.timeline?.replied)
        .map((c) => daysBetween(c.timeline!.replied!, c.timeline!.interviewed!));
      const hiredList = mine.filter((c) => c.stage === 'hired' && c.hiredAt);
      const waiting = [
        ...pendingReviewList.map((c) => daysBetween(c.appliedAt, now)),
        ...pendingReplyList.map((c) => daysBetween(c.timeline!.screened!, now)),
      ];
      return {
        user,
        assigned: mine.length,
        active: mine.filter((c) => c.stage !== 'hired' && c.stage !== 'rejected').length,
        reviewed: reviewedList.length,
        pendingReview: pendingReviewList.length,
        avgReview: avg(reviewDays),
        reviewOnTime: pct(reviewDays.filter((d) => d <= sla.review).length, reviewDays.length),
        replied: repliedList.length,
        pendingReply: pendingReplyList.length,
        avgReply: avg(replyDays),
        replyOnTime: pct(replyDays.filter((d) => d <= sla.reply).length, replyDays.length),
        interviews: interviewList.length,
        avgToInterview: avg(toInterview),
        offers: mine.filter((c) => c.timeline?.offered).length,
        hires: hiredList.length,
        rejected: mine.filter((c) => c.stage === 'rejected').length,
        avgTimeToHire: avg(hiredList.map((c) => daysBetween(c.appliedAt, c.hiredAt!))),
        avgWaiting: avg(waiting),
      };
    });
}

// ---------- Por vacante ----------
export interface JobStats {
  job: Job;
  daysOpen: number;
  candidates: number;
  active: number;
  hires: number;
  coverage: number; // % plazas cubiertas
  timeToFill: number | null; // días desde que se abrió hasta cada contratación (promedio)
  avgReview: number | null;
}

export function jobStats(jobs: Job[], cands: Candidate[], now: string): JobStats[] {
  return jobs.map((job) => {
    const mine = cands.filter((c) => c.jobId === job.id);
    const hired = mine.filter((c) => c.stage === 'hired' && c.hiredAt);
    const reviewed = mine.filter((c) => c.timeline?.screened);
    return {
      job,
      daysOpen: daysBetween(job.createdAt, now),
      candidates: mine.length,
      active: mine.filter((c) => c.stage !== 'hired' && c.stage !== 'rejected').length,
      hires: hired.length,
      coverage: pct(hired.length, job.openings) ?? 0,
      timeToFill: avg(hired.map((c) => daysBetween(job.createdAt, c.hiredAt!))),
      avgReview: avg(reviewed.map((c) => daysBetween(c.appliedAt, c.timeline!.screened!))),
    };
  });
}

// ---------- Pendientes fuera de meta ----------
export type AlertKind = 'review' | 'reply' | 'decide' | 'close' | 'cv_error';

export interface HrAlert {
  kind: AlertKind;
  label: string;
  candidate: Candidate;
  owner?: User;
  daysWaiting: number;
  sla: number;
  overdue: boolean;
}

export function alerts(cands: Candidate[], users: User[], now: string, sla: SlaGoals): HrAlert[] {
  const owner = (c: Candidate) => users.find((u) => u.id === c.ownerId);
  const out: HrAlert[] = [];
  for (const c of cands) {
    if (c.stage === 'hired' || c.stage === 'rejected') continue;
    const t = c.timeline ?? {};
    if (c.screeningStatus === 'error') {
      out.push({ kind: 'cv_error', label: 'CV ilegible: pedir versión legible', candidate: c, owner: owner(c), daysWaiting: daysBetween(c.appliedAt, now), sla: sla.review, overdue: daysBetween(c.appliedAt, now) > sla.review });
      continue;
    }
    if (!t.screened) {
      const d = daysBetween(c.appliedAt, now);
      out.push({ kind: 'review', label: 'Revisar el CV', candidate: c, owner: owner(c), daysWaiting: d, sla: sla.review, overdue: d > sla.review });
      continue;
    }
    if (!t.replied) {
      const d = daysBetween(t.screened, now);
      out.push({ kind: 'reply', label: 'Responder al candidato', candidate: c, owner: owner(c), daysWaiting: d, sla: sla.reply, overdue: d > sla.reply });
      continue;
    }
    if (t.interviewed && !decidedAt(c)) {
      const d = daysBetween(t.interviewed, now);
      out.push({ kind: 'decide', label: 'Decidir tras la entrevista', candidate: c, owner: owner(c), daysWaiting: d, sla: sla.decide, overdue: d > sla.decide });
      continue;
    }
    if (t.offered && !c.hiredAt) {
      const d = daysBetween(t.offered, now);
      out.push({ kind: 'close', label: 'Cerrar la oferta', candidate: c, owner: owner(c), daysWaiting: d, sla: sla.close, overdue: d > sla.close });
    }
  }
  return out.sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.daysWaiting - a.daysWaiting);
}

// ---------- Resumen del equipo ----------
export interface TeamKpis {
  received: number;
  reviewed: number;
  replied: number;
  interviews: number;
  hires: number;
  avgReview: number | null;
  avgReply: number | null;
  avgTimeToHire: number | null;
  avgTimeToFill: number | null;
  overdue: number;
  /** % de candidatos que pasaron cada corte del embudo. */
  conversion: { label: string; value: number; pct: number | null }[];
}

export function teamKpis(cands: Candidate[], jobs: Job[], users: User[], now: string, sla: SlaGoals): TeamKpis {
  const st = stageTimes(cands, sla);
  const hired = cands.filter((c) => c.stage === 'hired' && c.hiredAt);
  const reviewed = cands.filter((c) => c.timeline?.screened).length;
  const replied = cands.filter((c) => c.timeline?.replied).length;
  const interviews = cands.filter((c) => c.timeline?.interviewed).length;
  const offers = cands.filter((c) => c.timeline?.offered).length;
  const ttf = hired
    .map((c) => {
      const job = jobs.find((j) => j.id === c.jobId);
      return job ? daysBetween(job.createdAt, c.hiredAt!) : null;
    })
    .filter((v): v is number => v != null);
  return {
    received: cands.length,
    reviewed,
    replied,
    interviews,
    hires: hired.length,
    avgReview: st.find((s) => s.key === 'review')?.avg ?? null,
    avgReply: st.find((s) => s.key === 'reply')?.avg ?? null,
    avgTimeToHire: avg(hired.map((c) => daysBetween(c.appliedAt, c.hiredAt!))),
    avgTimeToFill: avg(ttf),
    overdue: alerts(cands, users, now, sla).filter((a) => a.overdue).length,
    conversion: [
      { label: 'Recibidos', value: cands.length, pct: 100 },
      { label: 'Revisados', value: reviewed, pct: pct(reviewed, cands.length) },
      { label: 'Respondidos', value: replied, pct: pct(replied, cands.length) },
      { label: 'Entrevistados', value: interviews, pct: pct(interviews, cands.length) },
      { label: 'Con oferta', value: offers, pct: pct(offers, cands.length) },
      { label: 'Contratados', value: hired.length, pct: pct(hired.length, cands.length) },
    ],
  };
}
