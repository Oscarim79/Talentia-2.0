import { supabase } from '../supabase';
import type { User, UserRole } from '../../types';
import { nullToUndefined, stripUndefined } from './rows';

/** Fila de `public.tenant_members`. */
export interface MemberRow {
  id: string;
  tenant_id: string;
  email: string | null; // null = persona agregada en Configuración (no inicia sesión)
  name: string;
  role: string;
  title: string | null;
}

export function rowToMember(r: MemberRow): User {
  return stripUndefined({
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    email: r.email ?? '',
    role: r.role as UserRole,
    title: nullToUndefined(r.title),
  });
}

export function memberToRow(u: User): MemberRow {
  return {
    id: u.id,
    tenant_id: u.tenantId,
    email: u.email === '' ? null : u.email,
    name: u.name,
    role: u.role,
    title: u.title ?? null,
  };
}

export async function listMembers(tenantId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('tenant_members')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as MemberRow[]).map(rowToMember);
}

export async function insertMember(u: User): Promise<void> {
  const { error } = await supabase.from('tenant_members').insert(memberToRow(u));
  if (error) throw error;
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from('tenant_members').delete().eq('id', id);
  if (error) throw error;
}

/** Membresías (una por empresa) de la persona con ese correo. RLS limita a sus empresas; el filtro por correo se hace aquí. */
export async function listMyMemberships(email: string): Promise<User[]> {
  const { data, error } = await supabase.from('tenant_members').select('*');
  if (error) throw error;
  const wanted = email.trim().toLowerCase();
  return (data as MemberRow[]).filter((r) => r.email?.toLowerCase() === wanted).map(rowToMember);
}
