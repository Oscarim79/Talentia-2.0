import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCandidates } from '../context/CandidatesContext';
import { useEvaluations } from '../context/EvaluationsContext';
import { useJobs } from '../context/JobsContext';
import { useOutreach } from '../context/OutreachContext';
import { useSettings } from '../context/SettingsContext';
import { useTalentActions } from '../context/TalentActionsContext';
import { LoadingScreen, ErrorScreen } from './StatusScreens';

/** Estado de carga que expone cada contexto de datos. */
interface ReadyEntry {
  ready: boolean;
  error: string | null;
  reload: () => void;
}

export function DataReadyGate({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const settings = useSettings();
  const jobs = useJobs();
  const candidates = useCandidates();
  const outreach = useOutreach();
  const evaluations = useEvaluations();
  const talentActions = useTalentActions();
  // Tarea 11: agregar aquí los demás contextos de datos.
  const entries: ReadyEntry[] = [settings, jobs, candidates, outreach, evaluations, talentActions];

  if (entries.some((e) => !e.ready)) return <LoadingScreen label="Cargando datos de la empresa…" />;
  const failed = entries.find((e) => e.error);
  if (failed) {
    return (
      <ErrorScreen
        message={failed.error ?? ''}
        onRetry={() => entries.forEach((e) => e.reload())}
        onSignOut={() => void signOut()}
      />
    );
  }
  return <>{children}</>;
}
