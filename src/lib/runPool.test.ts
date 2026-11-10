import { describe, expect, it } from 'vitest';
import { runPool } from './runPool';

describe('runPool', () => {
  it('no pasa de 3 en vuelo y termina todos', async () => {
    let inFlight = 0;
    let max = 0;
    const done: number[] = [];
    await runPool([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      inFlight++;
      max = Math.max(max, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      done.push(n);
    });
    expect(max).toBe(3);
    expect([...done].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('un fallo no detiene el lote', async () => {
    const done: number[] = [];
    await runPool([1, 2, 3], 2, async (n) => {
      if (n === 2) throw new Error('x');
      done.push(n);
    });
    expect(done).toEqual([1, 3]);
  });
  it('lista vacía termina sin llamar al trabajador', async () => {
    let calls = 0;
    await runPool([], 3, async () => {
      calls++;
    });
    expect(calls).toBe(0);
  });
});
