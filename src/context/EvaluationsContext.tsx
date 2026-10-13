import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SEED_EVALUATIONS } from '../data/seedEvaluations';
import type { InterviewEvaluation } from '../core/interviewGuide';
import { useTenant } from './TenantContext';

/**
 * Evaluaciones de la Entrevista por competencias (una por candidato): las de
 * ejemplo + las que el equipo captura. Demo: se guardan en localStorage de este
 * navegador; con Supabase pasarán a la tabla `interview_evaluations` sin cambiar
 * las páginas.
 */
interface EvaluationsCtxValue {
  /** Evaluaciones de la empresa actual, por id de candidato. */
  evaluations: Record<string, InterviewEvaluation>;
  saveEvaluation: (ev: InterviewEvaluation) => void;
  /** Cambia una evaluación existente a partir de su versión más reciente (no se pierden cambios seguidos). */
  updateEvaluation: (candidateId: string, fn: (prev: InterviewEvaluation) => InterviewEvaluation) => void;
}

const STORAGE_KEY = 'talentia.evaluations.v1';

const SEED_BY_ID: Record<string, InterviewEvaluation> = Object.fromEntries(SEED_EVALUATIONS.map((ev) => [ev.candidateId, ev]));

function load(): Record<string, InterviewEvaluation> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Record<string, InterviewEvaluation>) : {};
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

const EvaluationsContext = createContext<EvaluationsCtxValue | null>(null);

export function EvaluationsProvider({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const [saved, setSaved] = useState<Record<string, InterviewEvaluation>>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      /* modo privado / almacenamiento lleno: la sesión sigue en memoria */
    }
  }, [saved]);

  const saveEvaluation = useCallback((ev: InterviewEvaluation) => {
    setSaved((s) => ({ ...s, [ev.candidateId]: { ...ev, updatedAt: new Date().toISOString() } }));
  }, []);

  const updateEvaluation = useCallback((candidateId: string, fn: (prev: InterviewEvaluation) => InterviewEvaluation) => {
    setSaved((s) => {
      const prev = s[candidateId] ?? SEED_BY_ID[candidateId];
      if (!prev) return s;
      return { ...s, [candidateId]: { ...fn(prev), updatedAt: new Date().toISOString() } };
    });
  }, []);

  const evaluations = useMemo(() => {
    const all: Record<string, InterviewEvaluation> = { ...SEED_BY_ID, ...saved };
    return Object.fromEntries(Object.entries(all).filter(([, ev]) => ev.tenantId === tenant.id));
  }, [saved, tenant.id]);

  const value = useMemo<EvaluationsCtxValue>(
    () => ({ evaluations, saveEvaluation, updateEvaluation }),
    [evaluations, saveEvaluation, updateEvaluation],
  );

  return <EvaluationsContext.Provider value={value}>{children}</EvaluationsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEvaluations() {
  const ctx = useContext(EvaluationsContext);
  if (!ctx) throw new Error('useEvaluations debe usarse dentro de <EvaluationsProvider>');
  return ctx;
}
