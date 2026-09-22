import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MODULES, type ModuleId } from '../core/modules';
import { DEFAULT_SLA, type SlaGoals } from '../features/metrics/hrMetrics';
import { USERS } from '../data/seed';
import { newId } from '../lib/utils';
import type { User } from '../types';
import { useTenant } from './TenantContext';

/**
 * Configuración por empresa (tenant). Software opinado: lo único configurable
 * es encender/apagar módulos opcionales del catálogo fijo (`core/modules.ts`)
 * y la regla de respuesta automática a CVs.
 *
 * Demo: se persiste en localStorage del navegador. Con Supabase pasará a la
 * tabla `tenant_settings` sin cambiar la UI.
 */
export interface AutoReplyRule {
  enabled: boolean;
  /** Score mínimo de screening para responder automáticamente (0-100). */
  minScore: number;
}

/** Persona de RR.HH. agregada desde Configuración (las de fábrica vienen del seed). */
export interface TeamMember {
  id: string;
  name: string;
  title: string;
}

export interface TenantSettings {
  modules: Record<ModuleId, boolean>;
  autoReply: AutoReplyRule;
  /** Metas de servicio en días (editables). */
  sla: SlaGoals;
  /** Personas agregadas al equipo de RR.HH. */
  team: TeamMember[];
}

interface SettingsCtxValue {
  settings: TenantSettings;
  isModuleEnabled: (id: ModuleId) => boolean;
  setModuleEnabled: (id: ModuleId, enabled: boolean) => void;
  setAutoReply: (rule: AutoReplyRule) => void;
  setSla: (sla: SlaGoals) => void;
  addTeamMember: (name: string, title: string) => void;
  removeTeamMember: (id: string) => void;
  /** Equipo de RR.HH. completo: personas de fábrica (seed) + agregadas en Configuración. */
  hrTeam: User[];
}

const STORAGE_KEY = 'talentia.settings.v1';

function defaultSettings(): TenantSettings {
  const modules = Object.fromEntries(MODULES.map((m) => [m.id, m.defaultEnabled])) as Record<ModuleId, boolean>;
  return { modules, autoReply: { enabled: false, minScore: 70 }, sla: { ...DEFAULT_SLA }, team: [] };
}

type Store = Record<string, TenantSettings>;

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function saveStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* modo privado / almacenamiento bloqueado: la sesión sigue en memoria */
  }
}

const SettingsContext = createContext<SettingsCtxValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const [store, setStore] = useState<Store>(loadStore);

  useEffect(() => saveStore(store), [store]);

  const settings = useMemo<TenantSettings>(() => {
    const base = defaultSettings();
    const saved = store[tenant.id];
    if (!saved) return base;
    return {
      modules: { ...base.modules, ...saved.modules },
      autoReply: { ...base.autoReply, ...saved.autoReply },
      sla: { ...base.sla, ...saved.sla },
      team: saved.team ?? [],
    };
  }, [store, tenant.id]);

  const hrTeam = useMemo<User[]>(
    () => [
      ...USERS.filter((u) => u.tenantId === tenant.id && u.role !== 'owner'),
      ...settings.team.map((m) => ({ id: m.id, tenantId: tenant.id, name: m.name, email: '', role: 'recruiter' as const, title: m.title })),
    ],
    [tenant.id, settings.team],
  );

  const update = useCallback(
    (patch: (prev: TenantSettings) => TenantSettings) => {
      setStore((prev) => {
        const current = prev[tenant.id] ?? defaultSettings();
        return { ...prev, [tenant.id]: patch(current) };
      });
    },
    [tenant.id],
  );

  const value = useMemo<SettingsCtxValue>(
    () => ({
      settings,
      isModuleEnabled: (id) => settings.modules[id] ?? false,
      setModuleEnabled: (id, enabled) =>
        update((prev) => ({ ...prev, modules: { ...prev.modules, [id]: enabled } })),
      setAutoReply: (rule) => update((prev) => ({ ...prev, autoReply: rule })),
      setSla: (sla) => update((prev) => ({ ...prev, sla })),
      addTeamMember: (name, title) =>
        update((prev) => ({ ...prev, team: [...prev.team, { id: newId('u'), name: name.trim(), title: title.trim() }] })),
      removeTeamMember: (id) => update((prev) => ({ ...prev, team: prev.team.filter((m) => m.id !== id) })),
      hrTeam,
    }),
    [settings, update, hrTeam],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de <SettingsProvider>');
  return ctx;
}
