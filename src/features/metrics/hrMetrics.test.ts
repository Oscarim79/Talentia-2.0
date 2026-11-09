import { describe, expect, it } from 'vitest';
import { CANDIDATES, USERS } from '../../data/seed';
import { DEFAULT_SLA, recruiterStats, teamKpis } from './hrMetrics';

describe('hrMetrics con dueño nulo', () => {
  const cands = CANDIDATES.filter((c) => c.tenantId === 't_americana').map((c, i) => (i === 0 ? { ...c, ownerId: undefined } : c));
  const users = USERS.filter((u) => u.tenantId === 't_americana' && u.role !== 'owner' && u.role !== 'super_admin');
  it('no lanza y no inventa personas', () => {
    expect(() => recruiterStats(cands, users, '2026-11-09', DEFAULT_SLA)).not.toThrow();
    expect(recruiterStats(cands, users, '2026-11-09', DEFAULT_SLA).map((r) => r.user.id)).toEqual(users.map((u) => u.id));
    expect(teamKpis(cands, [], users, '2026-11-09', DEFAULT_SLA)).toBeTruthy();
  });
});
