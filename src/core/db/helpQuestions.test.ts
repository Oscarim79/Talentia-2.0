import { describe, expect, it } from 'vitest';
import { rowToQuestion } from './helpQuestions';

describe('helpQuestions mapper', () => {
  it('convierte la fila al tipo de dominio (asked_at -> at, sin tenant ni miembro)', () => {
    expect(
      rowToQuestion({
        id: 'q1',
        asked_at: '2026-11-09T10:00:00.000Z',
        route: '/screening',
        question: '¿Qué?',
        answered: false,
        tenant_id: 't',
        member_id: null,
      }),
    ).toEqual({ id: 'q1', at: '2026-11-09T10:00:00.000Z', route: '/screening', question: '¿Qué?', answered: false });
  });
});
