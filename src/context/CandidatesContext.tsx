import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CANDIDATES } from '../data/seed';
import type { Candidate, CandidateStage } from '../types';
import { useTenant } from './TenantContext';

/**
 * Candidatos compartidos por Screening, Respuestas a CVs, Candidatos y Entrevistas IA:
 * los de ejemplo (seed) + los CVs que el equipo carga en Screening IA.
 *
 * Antes los CVs cargados vivían solo dentro de la página de Screening: al ir a
 * Respuestas a CVs no aparecían y al volver ya no estaban (reporte de Reynaldo,
 * 2026-09-22). Demo: se guardan en localStorage de este navegador. Con Supabase
 * pasará a la tabla `candidates` sin cambiar las páginas.
 */
interface CandidatesCtxValue {
  /** Candidatos de la empresa actual: ejemplo + cargados, con su etapa vigente. */
  candidates: Candidate[];
  /** Agrega un CV procesado en Screening IA. */
  addCandidate: (c: Candidate) => void;
  /** Al confirmar la entrevista, el candidato pasa a la etapa Entrevista (si aún no avanzó más). */
  markInterviewScheduled: (candidateId: string) => void;
}

const STORAGE_KEY = 'talentia.candidates.v1';
/** Tope de CVs cargados que se guardan en el navegador (los más recientes). */
const MAX_UPLOADED = 500;

interface Store {
  uploaded: Candidate[];
  /** Etapa actual cuando cambió desde la app (ej. entrevista confirmada). */
  stages: Record<string, CandidateStage>;
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? (JSON.parse(raw) as Partial<Store>) : {};
    return { uploaded: Array.isArray(s.uploaded) ? s.uploaded : [], stages: s.stages ?? {} };
  } catch {
    return { uploaded: [], stages: {} };
  }
}

const EARLY: CandidateStage[] = ['applied', 'screening'];

const CandidatesContext = createContext<CandidatesCtxValue | null>(null);

export function CandidatesProvider({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const [store, setStore] = useState<Store>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* modo privado / almacenamiento lleno: la sesión sigue en memoria */
    }
  }, [store]);

  const addCandidate = useCallback((c: Candidate) => {
    setStore((s) => ({ ...s, uploaded: [...s.uploaded, c].slice(-MAX_UPLOADED) }));
  }, []);

  const markInterviewScheduled = useCallback((candidateId: string) => {
    setStore((s) => {
      const base = s.uploaded.find((c) => c.id === candidateId) ?? CANDIDATES.find((c) => c.id === candidateId);
      const current = s.stages[candidateId] ?? base?.stage;
      if (!current || !EARLY.includes(current)) return s;
      return { ...s, stages: { ...s.stages, [candidateId]: 'interview' } };
    });
  }, []);

  const candidates = useMemo(
    () =>
      [...CANDIDATES, ...store.uploaded]
        .filter((c) => c.tenantId === tenant.id)
        .map((c) => (store.stages[c.id] ? { ...c, stage: store.stages[c.id] } : c)),
    [store, tenant.id],
  );

  const value = useMemo<CandidatesCtxValue>(
    () => ({ candidates, addCandidate, markInterviewScheduled }),
    [candidates, addCandidate, markInterviewScheduled],
  );

  return <CandidatesContext.Provider value={value}>{children}</CandidatesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCandidates() {
  const ctx = useContext(CandidatesContext);
  if (!ctx) throw new Error('useCandidates debe usarse dentro de <CandidatesProvider>');
  return ctx;
}
