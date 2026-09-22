import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MODULES, type ModuleId } from '../core/modules';
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

export interface TenantSettings {
  modules: Record<ModuleId, boolean>;
  autoReply: AutoReplyRule;
}

interface SettingsCtxValue {
  settings: TenantSettings;
  isModuleEnabled: (id: ModuleId) => boolean;
  setModuleEnabled: (id: ModuleId, enabled: boolean) => void;
  setAutoReply: (rule: AutoReplyRule) => void;
}

const STORAGE_KEY = 'talentia.settings.v1';

function defaultSettings(): TenantSettings {
  const modules = Object.fromEntries(MODULES.map((m) => [m.id, m.defaultEnabled])) as Record<ModuleId, boolean>;
  return { modules, autoReply: { enabled: false, minScore: 70 } };
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
    };
  }, [store, tenant.id]);

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
    }),
    [settings, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de <SettingsProvider>');
  return ctx;
}
