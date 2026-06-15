import { createContext, useContext, useState, type ReactNode } from 'react';
import { JOBS } from '../data/seed';
import type { Job } from '../types';

interface JobsCtxValue {
  jobs: Job[];
  /** Crea una vacante nueva (la antepone a la lista para verla de inmediato). */
  addJob: (job: Job) => void;
}

const JobsContext = createContext<JobsCtxValue | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(JOBS);
  const addJob = (job: Job) => setJobs((prev) => [job, ...prev]);
  return <JobsContext.Provider value={{ jobs, addJob }}>{children}</JobsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs debe usarse dentro de <JobsProvider>');
  return ctx;
}
