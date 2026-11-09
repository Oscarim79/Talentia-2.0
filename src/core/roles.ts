// ============================================================
//  Reglas de roles (puras, sin dependencias).
//  owner = jefe de la empresa; super_admin = soporte de la plataforma;
//  admin y recruiter = equipo de RR.HH.
// ============================================================
import type { UserRole } from '../types';

const MANAGER_ROLES: readonly UserRole[] = ['owner', 'admin', 'super_admin'];

/** Puede gestionar (configuración, equipo, datos sensibles). */
export function canManage(role: UserRole): boolean {
  return MANAGER_ROLES.includes(role);
}

/** Pertenece al equipo de RR.HH. (no es jefe ni soporte de plataforma). */
export function isHrTeam(role: UserRole): boolean {
  return role !== 'owner' && role !== 'super_admin';
}
