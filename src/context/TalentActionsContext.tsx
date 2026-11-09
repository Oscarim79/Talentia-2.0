import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { listDone, setDone, unsetDone } from '../core/db/talentActions';
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
      if (ref.current.includes(personId)) {
        set((l) => l.filter((x) => x !== personId));
        unsetDone(tenant.id, personId).catch(() => {
          set((l) => (l.includes(personId) ? l : [...l, personId]));
          notifyError(SAVE_ERROR);
        });
      } else {
        set((l) => [...l, personId]);
        setDone(tenant.id, personId, member.id).catch(() => {
          set((l) => l.filter((x) => x !== personId));
          notifyError(SAVE_ERROR);
        });
      }
    },
    [tenant.id, member.id, set],
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
