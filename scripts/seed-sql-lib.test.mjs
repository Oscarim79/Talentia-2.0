import { describe, expect, it } from 'vitest';
import { daysBefore, relDate, relJsonb, sqlStr } from './seed-sql-lib.mjs';

describe('seed-sql-lib', () => {
  it('daysBefore cuenta días hasta el ancla', () => {
    expect(daysBefore('2026-06-10', '2026-06-20')).toBe(10);
    expect(daysBefore('2026-06-20', '2026-06-20')).toBe(0);
  });
  it('relDate produce SQL relativo a hoy', () => {
    expect(relDate('2026-06-10', '2026-06-20')).toBe('(current_date - 10)::text');
  });
  it('sqlStr escapa comillas simples', () => {
    expect(sqlStr("O'Higgins")).toBe("'O''Higgins'");
  });
  it('relJsonb convierte solo las fechas y conserva null/omisiones', () => {
    expect(relJsonb({ screened: '2026-06-10', replied: undefined }, '2026-06-20'))
      .toBe("jsonb_build_object('screened', (current_date - 10)::text)");
    expect(relJsonb({}, '2026-06-20')).toBe("'{}'::jsonb");
  });
});
