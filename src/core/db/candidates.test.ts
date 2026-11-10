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

describe('candidates: Entrega B (cv_path y parche de screening)', () => {
  it('cv_path hace ida y vuelta', () => {
    const c = { ...CANDIDATES[0], cvPath: 't/c/cv.pdf' };
    expect(rowToCandidate(candidateToRow(c))).toEqual(c);
    expect(candidateToRow(CANDIDATES[0]).cv_path).toBeNull();
  });
  it('el parche de screening manda sus columnas', () => {
    expect(candidatePatchToRow({ screeningStatus: 'scored', screeningScore: 88, errorReason: undefined, firstName: 'Ana' })).toEqual({
      screening_status: 'scored',
      screening_score: 88,
      error_reason: null,
      first_name: 'Ana',
    });
    expect(candidatePatchToRow({ timeline: { screened: '2026-11-10' }, cvPath: 'a/b/c.pdf', parsed: undefined })).toEqual({
      timeline: { screened: '2026-11-10' },
      cv_path: 'a/b/c.pdf',
      parsed: null,
    });
  });
});
