import { describe, expect, it } from 'vitest';
import { SEED_EVALUATIONS } from '../../data/seedEvaluations';
import { evaluationToRow, rowToEvaluation } from './evaluations';

describe('evaluations mapper', () => {
  it('ida y vuelta de la primera evaluación del seed', () => {
    const ev = SEED_EVALUATIONS[0];
    expect(rowToEvaluation(evaluationToRow(ev))).toEqual(ev);
  });
  it('todas las evaluaciones del seed hacen ida y vuelta', () => {
    for (const ev of SEED_EVALUATIONS) expect(rowToEvaluation(evaluationToRow(ev))).toEqual(ev);
  });
  it('el origen "ai" hace ida y vuelta', () => {
    const ev = { ...SEED_EVALUATIONS[0], source: 'ai' as const };
    expect(rowToEvaluation(evaluationToRow(ev))).toEqual(ev);
  });
  it('sin origen vuelve sin la clave source', () => {
    const { source: _omit, ...ev } = SEED_EVALUATIONS[0];
    void _omit;
    const back = rowToEvaluation(evaluationToRow(ev));
    expect('source' in back).toBe(false);
    expect(back).toEqual(ev);
  });
});
