import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { listDone, setDone, unsetDone } from '../core/db/talentActions';
import { createLatestWriteQueue } from '../lib/latestWriteQueue';
import { notifyError } from '../lib/notify';
import { useTenant } from './TenantContext';
import { useTenantData } from './useTenantData';

/**
 * Acciones de Talento ya completadas (por persona). Se guardan en Supabase
 * (tabla `talent_actions_done`): todo el equipo de RR.HH. ve lo mismo.
 */
interface TalentActionsCtxValue {
  done: Set<string>;
  toggleDone: (personId: string) => void;
  ready: boolean;
  error: string | null;
  reload: () => void;
}

const SAVE_ERROR = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';
const NONE: string[] = [];

const TalentActionsContext = createContext<TalentActionsCtxValue | null>(null);

export function TalentActionsProvider({ children }: { children: ReactNode }) {
  const { tenant, member } = useTenant();
  const { data, setData, ready, error, reload } = useTenantData(listDone, NONE);

  const queue = useMemo(() => createLatestWriteQueue(), []);

  const ref = useRef<string[]>(data);
  ref.current = data;

  const done = useMemo(() => new Set(data), [data]);

  const set = useCallback(
    (fn: (list: string[]) => string[]) => {
      ref.current = fn(ref.current);
      setData(fn);
    },
    [setData],
  );

  const toggleDone = useCallback(
    (personId: string) => {
      const wanted = !ref.current.includes(personId);
      set((l) => (wanted ? (l.includes(personId) ? l : [...l, personId]) : l.filter((x) => x !== personId)));
      // Una escritura a la vez por persona; la tarea lee el estado deseado MÁS RECIENTE al ejecutarse.
      let wrote = wanted;
      queue
        .run(personId, () => {
          wrote = ref.current.includes(personId);
          return wrote ? setDone(tenant.id, personId, member.id) : unsetDone(tenant.id, personId);
        })
        .catch(() => {
          // Deshace solo si la lista sigue reflejando este cambio; si no, hay uno más nuevo.
          set((l) => {
            if (l.includes(personId) !== wrote) return l;
            return wrote ? l.filter((x) => x !== personId) : [...l, personId];
          });
          notifyError(SAVE_ERROR);
        });
    },
    [tenant.id, member.id, set, queue],
  );

  const value = useMemo<TalentActionsCtxValue>(
    () => ({ done, toggleDone, ready, error, reload }),
    [done, toggleDone, ready, error, reload],
  );

  return <TalentActionsContext.Provider value={value}>{children}</TalentActionsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTalentActions() {
  const ctx = useContext(TalentActionsContext);
  if (!ctx) throw new Error('useTalentActions debe usarse dentro de <TalentActionsProvider>');
  return ctx;
}
