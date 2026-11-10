import { supabase } from '../supabase';

const BUCKET = 'cvs';
const PAGE = 100;

/** Borra los CVs guardados de la empresa (carpeta `cvs/<tenant_id>/`), candidato por candidato. */
export async function clearTenantCvs(tenantId: string): Promise<void> {
  const bucket = supabase.storage.from(BUCKET);
  const { data: folders, error } = await bucket.list(tenantId, { limit: 1000 });
  if (error) throw error;
  const paths: string[] = [];
  for (const folder of folders ?? []) {
    for (let offset = 0; ; offset += PAGE) {
      const { data: files, error: listError } = await bucket.list(`${tenantId}/${folder.name}`, { limit: PAGE, offset });
      if (listError) throw listError;
      if (!files || files.length === 0) break;
      for (const f of files) paths.push(`${tenantId}/${folder.name}/${f.name}`);
      if (files.length < PAGE) break;
    }
  }
  for (let i = 0; i < paths.length; i += PAGE) {
    const { error: removeError } = await bucket.remove(paths.slice(i, i + PAGE));
    if (removeError) throw removeError;
  }
}

/**
 * Restablece los datos de ejemplo de la empresa (función `reset_demo` de la base de datos).
 * Antes borra los CVs guardados; si eso falla, se sigue con el reset (los archivos sueltos no rompen nada).
 */
export async function resetDemo(tenantId: string): Promise<void> {
  try {
    await clearTenantCvs(tenantId);
  } catch (err) {
    console.warn('No se pudieron borrar los CVs guardados de la empresa', err);
  }
  const { error } = await supabase.rpc('reset_demo', { p_tenant_id: tenantId });
  if (error) throw error;
}
