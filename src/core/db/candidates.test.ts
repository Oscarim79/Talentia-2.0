import { describe, expect, it } from 'vitest';
import { CANDIDATES } from '../../data/seed';
import { candidateToRow, candidatePatchToRow, rowToCandidate } from './candidates';

describe('candidates mapper', () => {
  it('ida y vuelta sin pérdida (candidato completo)', () => {
    const c = CANDIDATES.find((x) => x.id === 'cand_10')!;
    expect(rowToCandidate(candidateToRow(c))).toEqual(c);
  });
  it('los opcionales ausentes vuelven como undefined, no null', () => {
    const c = CANDIDATES.find((x) => x.screeningStatus === 'error')!;
    const back = rowToCandidate(candidateToRow(c));
    expect(back.screeningScore).toBeUndefined();
    expect(back).toEqual(c);
  });
  it('todos los candidatos del seed hacen ida y vuelta', () => {
    for (const c of CANDIDATES) expect(rowToCandidate(candidateToRow(c))).toEqual(c);
  });
  it('el parche solo manda las claves presentes', () => {
    expect(candidatePatchToRow({ stage: 'hired' })).toEqual({ stage: 'hired' });
    expect(candidatePatchToRow({ hiredAt: undefined, ownerId: 'u1' })).toEqual({ hired_at: null, owner_id: 'u1' });
  });
});
