import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { useSettings } from '../context/SettingsContext';
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
  // Tareas 9–11: agregar aquí los demás contextos de datos (cada uno con ready/error/reload).
  const entries: ReadyEntry[] = [settings, jobs];

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
