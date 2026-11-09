import { supabase } from '../supabase';

/** Restablece los datos de ejemplo de la empresa (función `reset_demo` de la base de datos). */
export async function resetDemo(tenantId: string): Promise<void> {
  const { error } = await supabase.rpc('reset_demo', { p_tenant_id: tenantId });
  if (error) throw error;
}
