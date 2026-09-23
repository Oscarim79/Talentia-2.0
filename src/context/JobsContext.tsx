import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { JOBS } from '../data/seed';
import type { Job } from '../types';

interface JobsCtxValue {
  jobs: Job[];
  /** Crea una vacante nueva (la antepone a la lista para verla de inmediato). */
  addJob: (job: Job) => void;
}

/** Demo: las vacantes creadas se guardan en este navegador (sus CVs cargados también, ver CandidatesContext). */
const STORAGE_KEY = 'talentia.jobs.v1';

function loadCreated(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Job[]) : [];
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const JobsContext = createContext<JobsCtxValue | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [created, setCreated] = useState<Job[]>(loadCreated);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
    } catch {
      /* sin almacenamiento: la sesión sigue en memoria */
    }
  }, [created]);
  const value = useMemo<JobsCtxValue>(
    () => ({ jobs: [...created, ...JOBS], addJob: (job) => setCreated((prev) => [job, ...prev]) }),
    [created],
  );
  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs debe usarse dentro de <JobsProvider>');
  return ctx;
}
