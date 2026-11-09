// ============================================================
//  Cliente único de Supabase.
//  Si faltan las variables de entorno, la app falla al arrancar
//  (igual que core/providers.ts) en lugar de fallar a mitad de uso.
// ============================================================
import { createClient } from '@supabase/supabase-js';

export const MISSING_ENV_MESSAGE =
  'Falta configurar Supabase: define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.local (local) o en las variables del repositorio (GitHub Pages).';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(MISSING_ENV_MESSAGE);
}

export const supabase = createClient(url, key);
