import { supabase } from '../supabase';
import { MODULES, type ModuleId } from '../modules';
import { DEFAULT_SLA, type SlaGoals } from '../../features/metrics/hrMetrics';

export interface AutoReplyRule {
  enabled: boolean;
  /** Score mínimo de screening para responder automáticamente (0-100). */
  minScore: number;
}

/** Configuración por empresa. Software opinado: solo módulos opcionales, respuesta automática y metas de servicio. */
export interface TenantSettings {
  modules: Record<ModuleId, boolean>;
  autoReply: AutoReplyRule;
  /** Metas de servicio en días (editables). */
  sla: SlaGoals;
}

/** Fila de `public.tenant_settings`. */
export interface SettingsRow {
  tenant_id: string;
  modules: Partial<Record<ModuleId, boolean>> | null;
  auto_reply: Partial<AutoReplyRule> | null;
  sla: Partial<SlaGoals> | null;
}

export function defaultSettings(): TenantSettings {
  const modules = Object.fromEntries(MODULES.map((m) => [m.id, m.defaultEnabled])) as Record<ModuleId, boolean>;
  return { modules, autoReply: { enabled: false, minScore: 70 }, sla: { ...DEFAULT_SLA } };
}

/** Combina lo guardado sobre los valores de fábrica, clave por clave. */
export function rowToSettings(r: SettingsRow): TenantSettings {
  const base = defaultSettings();
  return {
    modules: { ...base.modules, ...(r.modules ?? {}) },
    autoReply: { ...base.autoReply, ...(r.auto_reply ?? {}) },
    sla: { ...base.sla, ...(r.sla ?? {}) },
  };
}

export function settingsToRow(tenantId: string, s: TenantSettings): SettingsRow {
  return { tenant_id: tenantId, modules: s.modules, auto_reply: s.autoReply, sla: s.sla };
}

/** `null` si la empresa aún no guardó configuración (se usan los valores de fábrica). */
export async function getSettings(tenantId: string): Promise<TenantSettings | null> {
  const { data, error } = await supabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).maybeSingle();
  if (error) throw error;
  return data ? rowToSettings(data as SettingsRow) : null;
}

export async function upsertSettings(tenantId: string, s: TenantSettings): Promise<void> {
  const { error } = await supabase
    .from('tenant_settings')
    .upsert({ ...settingsToRow(tenantId, s), updated_at: new Date().toISOString() }, { onConflict: 'tenant_id' });
  if (error) throw error;
}
