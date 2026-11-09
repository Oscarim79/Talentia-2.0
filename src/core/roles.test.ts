import { describe, expect, it } from 'vitest';
import { canManage, isHrTeam } from './roles';

describe('roles', () => {
  it('solo jefes y administradores gestionan', () => {
    expect(canManage('owner')).toBe(true);
    expect(canManage('admin')).toBe(true);
    expect(canManage('super_admin')).toBe(true);
    expect(canManage('recruiter')).toBe(false);
  });
  it('el equipo de RR.HH. excluye owner y super_admin', () => {
    expect(isHrTeam('admin')).toBe(true);
    expect(isHrTeam('recruiter')).toBe(true);
    expect(isHrTeam('owner')).toBe(false);
    expect(isHrTeam('super_admin')).toBe(false);
  });
});
