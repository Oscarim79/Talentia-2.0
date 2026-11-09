import { supabase } from '../supabase';
import type { Tenant } from '../../types';

/** Fila de `public.tenants` (tal cual la devuelve Supabase). */
export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  logo_emoji: string | null;
  industry: string | null;
  brands: string[] | null;
  plan_id: string | null;
  status: string | null;
  created_at: string | null; // date 'YYYY-MM-DD'
}

export function rowToTenant(r: TenantRow): Tenant {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoEmoji: r.logo_emoji ?? '',
    industry: r.industry ?? '',
    brands: r.brands ?? [],
    planId: r.plan_id ?? '',
    status: (r.status ?? 'active') as Tenant['status'],
    createdAt: r.created_at ?? '',
  };
}

/** Empresas a las que el usuario tiene acceso (RLS filtra por membresía). */
export async function listMyTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase.from('tenants').select('*').order('name', { ascending: true });
  if (error) throw error;
  return (data as TenantRow[]).map(rowToTenant);
}
