import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { ModuleId } from '../core/modules';
import type { SlaGoals } from '../features/metrics/hrMetrics';
import { defaultSettings, getSettings, upsertSettings, type AutoReplyRule, type TenantSettings } from '../core/db/settings';
import { deleteMember, insertMember, listMembers } from '../core/db/members';
import { isHrTeam } from '../core/roles';
import { notifyError } from '../lib/notify';
import { newId } from '../lib/utils';
import type { User } from '../types';
import { useTenant } from './TenantContext';
import { useTenantData } from './useTenantData';

export type { TenantSettings, AutoReplyRule } from '../core/db/settings';

/**
 * Configuración por empresa (tenant), guardada en Supabase (`tenant_settings`
 * y `tenant_members`). Software opinado: lo único configurable es encender/apagar
 * módulos opcionales, la regla de respuesta automática y las metas de servicio.
 */
interface SettingsCtxValue {
  settings: TenantSettings;
  isModuleEnabled: (id: ModuleId) => boolean;
  setModuleEnabled: (id: ModuleId, enabled: boolean) => void;
  setAutoReply: (rule: AutoReplyRule) => void;
  setSla: (sla: SlaGoals) => void;
  addTeamMember: (name: string, title: string) => void;
  removeTeamMember: (id: string) => void;
  /** Equipo de RR.HH.: personas con acceso + agregadas en Configuración. */
  hrTeam: User[];
  ready: boolean;
  error: string | null;
  reload: () => void;
}

const SAVE_ERROR = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';
const INITIAL: [TenantSettings | null, User[]] = [null, []];

const SettingsContext = createContext<SettingsCtxValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const { data, setData, ready, error, reload } = useTenantData(
    (t) => Promise.all([getSettings(t), listMembers(t)]) as Promise<[TenantSettings | null, User[]]>,
    INITIAL,
  );
  const settings = data[0] ?? defaultSettings();
  const members = data[1];
  const hrTeam = useMemo(() => members.filter((m) => isHrTeam(m.role)), [members]);

  const update = useCallback(
    (patch: (prev: TenantSettings) => TenantSettings) => {
      const prev = data[0] ?? defaultSettings();
      const next = patch(prev);
      setData(([, m]) => [next, m]);
      upsertSettings(tenant.id, next).catch(() => {
        setData(([, m]) => [prev, m]);
        notifyError(SAVE_ERROR);
      });
    },
    [data, setData, tenant.id],
  );

  const addTeamMember = useCallback(
    (name: string, title: string) => {
      const member: User = { id: newId('u'), tenantId: tenant.id, name: name.trim(), email: '', role: 'recruiter', title: title.trim() };
      setData(([s, m]) => [s, [...m, member]]);
      insertMember(member).catch(() => {
        setData(([s, m]) => [s, m.filter((x) => x.id !== member.id)]);
        notifyError(SAVE_ERROR);
      });
    },
    [setData, tenant.id],
  );

  const removeTeamMember = useCallback(
    (id: string) => {
      const member = members.find((m) => m.id === id);
      if (!member || member.email !== '') return;
      setData(([s, m]) => [s, m.filter((x) => x.id !== id)]);
      deleteMember(id).catch(() => {
        setData(([s, m]) => [s, m.some((x) => x.id === id) ? m : [...m, member]]);
        notifyError(SAVE_ERROR);
      });
    },
    [members, setData],
  );

  const value = useMemo<SettingsCtxValue>(
    () => ({
      settings,
      isModuleEnabled: (id) => settings.modules[id] ?? false,
      setModuleEnabled: (id, enabled) => update((prev) => ({ ...prev, modules: { ...prev.modules, [id]: enabled } })),
      setAutoReply: (rule) => update((prev) => ({ ...prev, autoReply: rule })),
      setSla: (sla) => update((prev) => ({ ...prev, sla })),
      addTeamMember,
      removeTeamMember,
      hrTeam,
      ready,
      error,
      reload,
    }),
    [settings, update, addTeamMember, removeTeamMember, hrTeam, ready, error, reload],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de <SettingsProvider>');
  return ctx;
}
