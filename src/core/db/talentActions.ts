import { supabase } from '../supabase';

/** Fila de `public.talent_actions_done`. */
export interface TalentActionRow {
  tenant_id: string;
  person_id: string;
  done_by: string | null;
  done_at: string; // timestamptz, lo pone la base de datos
}

/** Ids de las personas cuya acción de Talento ya se marcó como hecha. */
export async function listDone(tenantId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('talent_actions_done')
    .select('person_id')
    .eq('tenant_id', tenantId);
  if (error) throw error;
  return (data as Pick<TalentActionRow, 'person_id'>[]).map((r) => r.person_id);
}

export async function setDone(tenantId: string, personId: string, memberId: string | null): Promise<void> {
  const { error } = await supabase
    .from('talent_actions_done')
    .upsert(
      { tenant_id: tenantId, person_id: personId, done_by: memberId },
      { onConflict: 'tenant_id,person_id' },
    );
  if (error) throw error;
}

export async function unsetDone(tenantId: string, personId: string): Promise<void> {
  const { error } = await supabase
    .from('talent_actions_done')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('person_id', personId);
  if (error) throw error;
}
