import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { listEvaluations, upsertEvaluation } from '../core/db/evaluations';
import type { InterviewEvaluation } from '../core/interviewGuide';
import { todayISO } from '../lib/dates';
import { createLatestWriteQueue } from '../lib/latestWriteQueue';
import { notifyError } from '../lib/notify';
import { useTenantData } from './useTenantData';

/**
 * Evaluaciones de la Entrevista por competencias (una por candidato).
 * Se guardan en Supabase (tabla `interview_evaluations`): todo el equipo ve las mismas.
 */
interface EvaluationsCtxValue {
  /** Evaluaciones de la empresa actual, por id de candidato. */
  evaluations: Record<string, InterviewEvaluation>;
  saveEvaluation: (ev: InterviewEvaluation) => void;
  /** Cambia una evaluación existente a partir de su versión más reciente (no se pierden cambios seguidos). */
  updateEvaluation: (candidateId: string, fn: (prev: InterviewEvaluation) => InterviewEvaluation) => void;
  ready: boolean;
  error: string | null;
  reload: () => void;
}

type EvalMap = Record<string, InterviewEvaluation>;

const SAVE_ERROR = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';
const NONE: EvalMap = {};

async function loadAll(tenantId: string): Promise<EvalMap> {
  const list = await listEvaluations(tenantId);
  return Object.fromEntries(list.map((ev) => [ev.candidateId, ev]));
}

/** Fija la fecha (nunca vacía: la columna es obligatoria) y la hora de modificación. */
function stamp(ev: InterviewEvaluation): InterviewEvaluation {
  return { ...ev, date: ev.date || todayISO(), updatedAt: new Date().toISOString() };
}

const EvaluationsContext = createContext<EvaluationsCtxValue | null>(null);

export function EvaluationsProvider({ children }: { children: ReactNode }) {
  const { data: evaluations, setData, ready, error, reload } = useTenantData(loadAll, NONE);

  const queue = useMemo(() => createLatestWriteQueue(), []);

  // Última versión conocida (incluye cambios aún sin render).
  const ref = useRef<EvalMap>(evaluations);
  ref.current = evaluations;

  const set = useCallback(
    (fn: (s: EvalMap) => EvalMap) => {
      ref.current = fn(ref.current);
      setData(fn);
    },
    [setData],
  );

  const persist = useCallback(
    (next: InterviewEvaluation) => {
      const id = next.candidateId;
      const before = ref.current[id];
      set((s) => ({ ...s, [id]: next }));
      // Una escritura a la vez por candidato; si hay varias seguidas, solo se envía la última.
      queue.run(id, () => upsertEvaluation(next)).catch(() => {
        // Restaura solo si nadie la cambió después; si no, ya hay una versión más nueva.
        set((s) => {
          if (s[id] !== next) return s;
          const rest = { ...s };
          delete rest[id];
          return before ? { ...rest, [id]: before } : rest;
        });
        notifyError(SAVE_ERROR);
      });
    },
    [set, queue],
  );

  const saveEvaluation = useCallback((ev: InterviewEvaluation) => persist(stamp(ev)), [persist]);

  const updateEvaluation = useCallback(
    (candidateId: string, fn: (prev: InterviewEvaluation) => InterviewEvaluation) => {
      const prev = ref.current[candidateId];
      if (!prev) return;
      persist(stamp(fn(prev)));
    },
    [persist],
  );

  const value = useMemo<EvaluationsCtxValue>(
    () => ({ evaluations, saveEvaluation, updateEvaluation, ready, error, reload }),
    [evaluations, saveEvaluation, updateEvaluation, ready, error, reload],
  );

  return <EvaluationsContext.Provider value={value}>{children}</EvaluationsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEvaluations() {
  const ctx = useContext(EvaluationsContext);
  if (!ctx) throw new Error('useEvaluations debe usarse dentro de <EvaluationsProvider>');
  return ctx;
}
