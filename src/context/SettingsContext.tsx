import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
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

  // Última configuración conocida (incluye cambios aún sin render): evita pisar ediciones seguidas.
  const settingsRef = useRef<TenantSettings>(settings);
  settingsRef.current = settings;

  /** Aplica `patch` de inmediato y lo guarda. Si falla, `undo` deshace solo ese cambio sobre el estado actual. */
  const update = useCallback(
    (patch: (cur: TenantSettings) => TenantSettings, undo: (cur: TenantSettings, before: TenantSettings) => TenantSettings) => {
      const before = settingsRef.current;
      const next = patch(before);
      settingsRef.current = next;
      setData(([, m]) => [next, m]);
      upsertSettings(tenant.id, next).catch(() => {
        const reverted = undo(settingsRef.current, before);
        settingsRef.current = reverted;
        setData(([, m]) => [reverted, m]);
        notifyError(SAVE_ERROR);
      });
    },
    [setData, tenant.id],
  );

  const isModuleEnabled = useCallback((id: ModuleId) => settings.modules[id] ?? false, [settings]);
  const setModuleEnabled = useCallback(
    (id: ModuleId, enabled: boolean) =>
      update(
        (cur) => ({ ...cur, modules: { ...cur.modules, [id]: enabled } }),
        (cur, before) => ({ ...cur, modules: { ...cur.modules, [id]: before.modules[id] } }),
      ),
    [update],
  );
  const setAutoReply = useCallback(
    (rule: AutoReplyRule) =>
      update(
        (cur) => ({ ...cur, autoReply: rule }),
        (cur, before) => ({ ...cur, autoReply: before.autoReply }),
      ),
    [update],
  );
  const setSla = useCallback(
    (sla: SlaGoals) =>
      update(
        (cur) => ({ ...cur, sla }),
        (cur, before) => ({ ...cur, sla: before.sla }),
      ),
    [update],
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
      isModuleEnabled,
      setModuleEnabled,
      setAutoReply,
      setSla,
      addTeamMember,
      removeTeamMember,
      hrTeam,
      ready,
      error,
      reload,
    }),
    [settings, isModuleEnabled, setModuleEnabled, setAutoReply, setSla, addTeamMember, removeTeamMember, hrTeam, ready, error, reload],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de <SettingsProvider>');
  return ctx;
}
