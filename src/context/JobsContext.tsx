import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { insertJob, listJobs, updateJobRow } from '../core/db/jobs';
import { notifyError } from '../lib/notify';
import type { Job } from '../types';
import { useTenantData } from './useTenantData';

interface JobsCtxValue {
  jobs: Job[];
  /** Crea una vacante nueva (la antepone a la lista para verla de inmediato). */
  addJob: (job: Job) => void;
  /** Guarda los cambios de una vacante existente (se ven de inmediato; si falla, se revierten). */
  updateJob: (job: Job) => void;
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
  const updateJob = useCallback(
    (job: Job) => {
      let previous: Job | undefined;
      setData((prev) =>
        prev.map((j) => {
          if (j.id !== job.id) return j;
          previous = j;
          return job;
        }),
      );
      updateJobRow(job).catch(() => {
        if (previous) setData((prev) => prev.map((j) => (j.id === job.id ? (previous as Job) : j)));
        notifyError('No se pudieron guardar los cambios. Revisa tu conexión e inténtalo de nuevo.');
      });
    },
    [setData],
  );
  const value = useMemo<JobsCtxValue>(
    () => ({ jobs, addJob, updateJob, ready, error, reload }),
    [jobs, addJob, updateJob, ready, error, reload],
  );
  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs debe usarse dentro de <JobsProvider>');
  return ctx;
}
