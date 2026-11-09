import { describe, expect, it } from 'vitest';
import { USERS } from '../../data/seed';
import { memberToRow, rowToMember } from './members';

describe('members mapper', () => {
  it('ida y vuelta sin pérdida (miembro completo)', () => {
    const u = USERS.find((x) => x.title)!;
    expect(rowToMember(memberToRow(u))).toEqual(u);
  });
  it('email vacío se guarda como null y vuelve como cadena vacía', () => {
    const u = { id: 'u_1', tenantId: 't', name: 'Ana', email: '', role: 'recruiter' as const };
    const row = memberToRow(u);
    expect(row.email).toBeNull();
    expect(row.title).toBeNull();
    const back = rowToMember(row);
    expect(back.email).toBe('');
    expect(back).toEqual(u);
    expect('title' in back).toBe(false);
  });
});
