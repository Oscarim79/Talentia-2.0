// ============================================================
//  Cliente único de Supabase.
//  Si faltan las variables de entorno NO se lanza un error (dejaría la
//  página en blanco): `supabaseConfigError` trae el aviso y main.tsx lo
//  muestra en pantalla.
// ============================================================
import { createClient } from '@supabase/supabase-js';

export const MISSING_ENV_MESSAGE =
  'Falta configurar Supabase: define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.local (local) o en las variables del repositorio (GitHub Pages).';

/** Devuelve el aviso si falta alguna variable (o está vacía); null si todo está bien. */
export function configError(url: string | undefined, key: string | undefined): string | null {
  return !url || !key ? MISSING_ENV_MESSAGE : null;
}

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigError = configError(url, key);

// Con la configuración incompleta se usan valores de relleno: el cliente
// nunca se usa en ese caso porque main.tsx muestra el aviso en su lugar.
export const supabase = createClient(url || 'https://sin-configurar.invalid', key || 'sin-configurar');
