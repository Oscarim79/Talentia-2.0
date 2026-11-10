import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { insertCandidate, listCandidates, updateCandidate, type CandidatePatch } from '../core/db/candidates';
import { stripUndefined } from '../core/db/rows';
import { applyReplied, applyStage } from '../core/stages';
import { todayISO } from '../lib/dates';
import { notifyError } from '../lib/notify';
import type { Candidate, CandidateStage } from '../types';
import { useTenant } from './TenantContext';
import { useTenantData } from './useTenantData';

/**
 * Candidatos compartidos por Screening, Respuestas a CVs, Candidatos y Entrevistas IA.
 * Se guardan en Supabase (tabla `candidates`): todo el equipo ve los mismos.
 * La línea de tiempo (fechas de cada etapa) se llena sola con cada acción de RR.HH.
 */
interface CandidatesCtxValue {
  /** Candidatos de la empresa actual, con su etapa vigente. */
  candidates: Candidate[];
  /** Agrega un candidato (CV cargado o de ejemplo). Resuelve `true` cuando ya quedó guardado en la base; `false` si falló (se avisa y se quita de la lista). */
  addCandidate: (c: Candidate) => Promise<boolean>;
  /** Al confirmar la entrevista, el candidato pasa a la etapa Entrevista (si aún no avanzó más). */
  markInterviewScheduled: (candidateId: string) => void;
  /** RR.HH. mueve al candidato de etapa (ej. después de evaluar la entrevista: Oferta o Descartado). */
  setStage: (candidateId: string, stage: CandidateStage) => void;
  /** Se le envió la respuesta al candidato: queda la fecha de la primera respuesta. */
  markReplied: (candidateId: string) => void;
  /** Guarda el resultado de la lectura del CV (o cualquier otro campo) de un candidato ya creado. */
  updateCandidateFields: (candidateId: string, patch: CandidatePatch) => void;
  ready: boolean;
  error: string | null;
  reload: () => void;
}

const SAVE_ERROR = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';
const EARLY: CandidateStage[] = ['applied', 'screening'];
const NONE: Candidate[] = [];

const CandidatesContext = createContext<CandidatesCtxValue | null>(null);

export function CandidatesProvider({ children }: { children: ReactNode }) {
  const { member } = useTenant();
  const { data: candidates, setData, ready, error, reload } = useTenantData(listCandidates, NONE);

  // Última lista conocida (incluye cambios aún sin render): evita calcular sobre datos viejos.
  const ref = useRef<Candidate[]>(candidates);
  ref.current = candidates;

  const set = useCallback(
    (fn: (list: Candidate[]) => Candidate[]) => {
      ref.current = fn(ref.current);
      setData(fn);
    },
    [setData],
  );

  /** Aplica el cambio a un candidato y lo guarda. Si falla, restaura solo esos campos del candidato. */
  const change = useCallback(
    (id: string, next: Candidate, patch: Parameters<typeof updateCandidate>[1]) => {
      const before = ref.current.find((c) => c.id === id);
      if (!before) return;
      set((list) => list.map((c) => (c.id === id ? next : c)));
      updateCandidate(id, patch).catch(() => {
        set((list) =>
          list.map((c) =>
            c.id === id ? { ...c, stage: before.stage, timeline: before.timeline, hiredAt: before.hiredAt } : c,
          ),
        );
        notifyError(SAVE_ERROR);
      });
    },
    [set],
  );

  const addCandidate = useCallback(
    (c: Candidate) => {
      const today = todayISO();
      const final: Candidate = {
        ...c,
        ownerId: member.id,
        appliedAt: today,
        ...(c.screeningStatus === 'scored' ? { timeline: { screened: today } } : {}),
      };
      set((list) => [...list, final]);
      return insertCandidate(final).then(
        () => true,
        () => {
          set((list) => list.filter((x) => x.id !== final.id));
          notifyError(SAVE_ERROR);
          return false;
        },
      );
    },
    [member.id, set],
  );

  const markInterviewScheduled = useCallback(
    (candidateId: string) => {
      const cur = ref.current.find((c) => c.id === candidateId);
      if (!cur || !EARLY.includes(cur.stage)) return;
      change(candidateId, { ...cur, stage: 'interview' }, { stage: 'interview' });
    },
    [change],
  );

  const setStage = useCallback(
    (candidateId: string, stage: CandidateStage) => {
      const cur = ref.current.find((c) => c.id === candidateId);
      if (!cur) return;
      const next = applyStage(cur, stage, todayISO());
      change(candidateId, next, { stage: next.stage, timeline: next.timeline, hiredAt: next.hiredAt });
    },
    [change],
  );

  const markReplied = useCallback(
    (candidateId: string) => {
      const cur = ref.current.find((c) => c.id === candidateId);
      if (!cur || cur.timeline?.replied) return;
      const next = applyReplied(cur, todayISO());
      change(candidateId, next, { timeline: next.timeline });
    },
    [change],
  );

  const updateCandidateFields = useCallback(
    (candidateId: string, patch: CandidatePatch) => {
      const before = ref.current.find((c) => c.id === candidateId);
      if (!before) return;
      const next = stripUndefined({ ...before, ...patch }) as Candidate;
      set((list) => list.map((c) => (c.id === candidateId ? next : c)));
      updateCandidate(candidateId, patch).catch(() => {
        set((list) => list.map((c) => (c.id === candidateId ? before : c)));
        notifyError(SAVE_ERROR);
      });
    },
    [set],
  );

  const value = useMemo<CandidatesCtxValue>(
    () => ({ candidates, addCandidate, markInterviewScheduled, setStage, markReplied, updateCandidateFields, ready, error, reload }),
    [candidates, addCandidate, markInterviewScheduled, setStage, markReplied, updateCandidateFields, ready, error, reload],
  );

  return <CandidatesContext.Provider value={value}>{children}</CandidatesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCandidates() {
  const ctx = useContext(CandidatesContext);
  if (!ctx) throw new Error('useCandidates debe usarse dentro de <CandidatesProvider>');
  return ctx;
}
