import { describe, expect, it } from 'vitest';
import { CANDIDATES } from '../data/seed';
import { applyReplied, applyStage } from './stages';

const base = { ...CANDIDATES.find((c) => c.id === 'cand_05')!, timeline: {} };

describe('applyStage', () => {
  it('oferta fija offered e interviewed si faltaba', () => {
    const c = applyStage(base, 'offer', '2026-11-09');
    expect(c.stage).toBe('offer');
    expect(c.timeline).toEqual({ offered: '2026-11-09', interviewed: '2026-11-09' });
  });
  it('no pisa fechas existentes', () => {
    const c = applyStage({ ...base, timeline: { interviewed: '2026-11-01' } }, 'offer', '2026-11-09');
    expect(c.timeline?.interviewed).toBe('2026-11-01');
  });
  it('descartado fija rejected; contratado fija hiredAt', () => {
    expect(applyStage(base, 'rejected', '2026-11-09').timeline?.rejected).toBe('2026-11-09');
    expect(applyStage(base, 'hired', '2026-11-09').hiredAt).toBe('2026-11-09');
  });
  it('applyReplied solo la primera vez', () => {
    const once = applyReplied(base, '2026-11-01');
    expect(applyReplied(once, '2026-11-09').timeline?.replied).toBe('2026-11-01');
  });
});
