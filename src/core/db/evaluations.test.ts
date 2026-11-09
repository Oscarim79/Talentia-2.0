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
});
