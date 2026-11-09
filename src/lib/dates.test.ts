import { describe, expect, it } from 'vitest';
import { addDaysISO, todayISO } from './dates';

describe('dates', () => {
  it('todayISO usa la fecha local, no UTC', () => {
    expect(todayISO(new Date(2026, 10, 9, 23, 30))).toBe('2026-11-09');
  });
  it('addDaysISO suma y resta días', () => {
    expect(addDaysISO('2026-06-20', -10)).toBe('2026-06-10');
    expect(addDaysISO('2026-12-30', 3)).toBe('2027-01-02');
  });
});
