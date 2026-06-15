// ============================================================
//  Cliente Supabase (auth + Postgres + Storage).
//  La publishable key es pública (vive en el cliente); la seguridad real
//  la dan las políticas RLS en la base, no el ocultamiento de la llave.
//
//  Este cliente queda LISTO para usarse. El intercambio de la capa de datos
//  (seed mock -> queries Supabase) se hace por feature, detrás de los puertos,
//  una vez aplicado el schema (supabase/migrations) y revisadas las políticas.
// ============================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE, SUPABASE_CONFIGURED } from './config';

export const supabase: SupabaseClient | null = SUPABASE_CONFIGURED
  ? createClient(SUPABASE.url, SUPABASE.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/**
 * Verifica que el cliente puede hablar con el proyecto (no valida el schema).
 * getSession funciona en cualquier proyecto, exista o no la base de datos.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.auth.getSession();
    return !error;
  } catch {
    return false;
  }
}
