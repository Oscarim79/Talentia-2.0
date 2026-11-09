import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { insertJob, listJobs } from '../core/db/jobs';
import { notifyError } from '../lib/notify';
import type { Job } from '../types';
import { useTenantData } from './useTenantData';

interface JobsCtxValue {
  jobs: Job[];
  /** Crea una vacante nueva (la antepone a la lista para verla de inmediato). */
  addJob: (job: Job) => void;
  ready: boolean;
  error: string | null;
  reload: () => void;
}

const INITIAL: Job[] = [];
const JobsContext = createContext<JobsCtxValue | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const { data: jobs, setData, ready, error, reload } = useTenantData(listJobs, INITIAL);
  const addJob = useCallback(
    (job: Job) => {
      setData((prev) => [job, ...prev]);
      insertJob(job).catch(() => {
        setData((prev) => prev.filter((j) => j.id !== job.id));
        notifyError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
      });
    },
    [setData],
  );
  const value = useMemo<JobsCtxValue>(() => ({ jobs, addJob, ready, error, reload }), [jobs, addJob, ready, error, reload]);
  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs debe usarse dentro de <JobsProvider>');
  return ctx;
}
