import { describe, expect, it } from 'vitest';
import { CANDIDATES, JOBS } from '../../data/seed';
import type { ParsedCv } from '../../types';
import type { ScoreResult } from '../../core/ports';
import { makeInvalidCandidate, makePendingCandidate, outcomeToPatch, pendingState } from './screeningResult';

const job = JOBS[0];
const PARSED: ParsedCv = { skills: ['ventas'], experience: [{ company: 'Max', role: 'Vendedora', years: 2 }], totalYears: 2, education: 'Diversificado' };
const SCORE: ScoreResult = { score: 80, matchPercent: 75, justification: 'ok', evidence: [{ criterion: 'A', matched: true, quote: 'a' }], flags: [] };

describe('screeningResult', () => {
  it('pendiente provisional', () => {
    const c = makePendingCandidate({ name: 'Maria_Gonzalez_CV.pdf' }, job, 'cand_x', 't/cand_x/maria_gonzalez_cv.pdf', '2026-11-10');
    expect(c).toMatchObject({
      id: 'cand_x',
      tenantId: job.tenantId,
      jobId: job.id,
      firstName: 'Maria',
      lastName: 'Gonzalez',
      screeningStatus: 'pending',
      stage: 'screening',
      email: '',
      phone: '',
      source: 'Carga directa',
      cvFileName: 'Maria_Gonzalez_CV.pdf',
      cvPath: 't/cand_x/maria_gonzalez_cv.pdf',
      appliedAt: '2026-11-10',
    });
  });
  it('resultado ok → scored con nombre de la IA', () => {
    const p = outcomeToPatch(
      { ok: true, person: { firstName: 'María', lastName: 'González', email: 'm@x.com', phone: '5' }, parsed: PARSED, score: SCORE },
      { firstName: 'Maria', lastName: 'Gonzalez' },
      '2026-11-10',
    );
    expect(p).toMatchObject({
      screeningStatus: 'scored',
      stage: 'screening',
      firstName: 'María',
      lastName: 'González',
      email: 'm@x.com',
      phone: '5',
      screeningScore: 80,
      matchPercent: 75,
      justification: 'ok',
      evidence: SCORE.evidence,
      flags: [],
      parsed: PARSED,
      timeline: { screened: '2026-11-10' },
    });
    expect('errorReason' in p && p.errorReason === undefined).toBe(true);
  });
  it('sin nombre de la IA conserva el provisional', () => {
    const p = outcomeToPatch(
      { ok: true, person: { firstName: '', lastName: '', email: '', phone: '' }, parsed: PARSED, score: SCORE },
      { firstName: 'Maria', lastName: 'Gonzalez' },
      '2026-11-10',
    );
    expect(p.firstName).toBe('Maria');
    expect(p.lastName).toBe('Gonzalez');
  });
  it('error → applied con código', () => {
    expect(outcomeToPatch({ ok: false, errorReason: 'ai_not_configured' }, { firstName: 'a', lastName: 'b' }, 'd')).toEqual({
      screeningStatus: 'error',
      stage: 'applied',
      errorReason: 'ai_not_configured',
    });
  });
  it('errores de archivo quitan cvPath (no hay archivo que abrir); los demás lo conservan', () => {
    for (const code of ['unsupported_format', 'too_large', 'upload_failed'] as const) {
      const p = outcomeToPatch({ ok: false, errorReason: code }, { firstName: 'a', lastName: 'b' }, 'd');
      expect('cvPath' in p && p.cvPath === undefined).toBe(true);
    }
    const p = outcomeToPatch({ ok: false, errorReason: 'ai_not_configured' }, { firstName: 'a', lastName: 'b' }, 'd');
    expect('cvPath' in p).toBe(false);
  });
  it('archivo inválido → candidato en error sin cvPath', () => {
    const c = makeInvalidCandidate({ name: 'viejo.doc' }, job, 'cand_y', 'unsupported_format', '2026-11-10');
    expect(c).toMatchObject({ id: 'cand_y', screeningStatus: 'error', stage: 'applied', errorReason: 'unsupported_format', cvFileName: 'viejo.doc' });
    expect(c.cvPath).toBeUndefined();
  });
  it('pendingState', () => {
    const c = { ...CANDIDATES[0], screeningStatus: 'pending' as const };
    expect(pendingState(c, new Set([c.id]))).toBe('processing');
    expect(pendingState(c, new Set())).toBe('stale');
    expect(pendingState({ ...c, screeningStatus: 'scored' }, new Set())).toBeNull();
  });
});
