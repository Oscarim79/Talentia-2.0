import { describe, expect, it } from 'vitest';
import { createLatestWriteQueue } from './latestWriteQueue';

function deferred() {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createLatestWriteQueue', () => {
  it('ejecuta en orden las tareas secuenciales', async () => {
    const q = createLatestWriteQueue();
    const log: number[] = [];
    await q.run('a', async () => void log.push(1));
    await q.run('a', async () => void log.push(2));
    expect(log).toEqual([1, 2]);
  });

  it('junta ráfagas: de 3 tareas solo corren la 1ª y la 3ª, en orden', async () => {
    const q = createLatestWriteQueue();
    const log: number[] = [];
    const d = deferred();
    const p1 = q.run('a', async () => {
      log.push(1);
      await d.promise;
    });
    const p2 = q.run('a', async () => void log.push(2));
    const p3 = q.run('a', async () => void log.push(3));
    d.resolve();
    await Promise.all([p1, p2, p3]);
    expect(log).toEqual([1, 3]);
  });

  it('un rechazo rechaza su propia promesa y no bloquea la siguiente', async () => {
    const q = createLatestWriteQueue();
    const d = deferred();
    const log: number[] = [];
    const p1 = q.run('a', () => d.promise);
    const p2 = q.run('a', async () => void log.push(2));
    d.reject(new Error('falla'));
    await expect(p1).rejects.toThrow('falla');
    await p2;
    expect(log).toEqual([2]);
  });

  it('las claves son independientes', async () => {
    const q = createLatestWriteQueue();
    const d = deferred();
    const log: string[] = [];
    const pa = q.run('a', async () => {
      await d.promise;
      log.push('a');
    });
    await q.run('b', async () => void log.push('b'));
    expect(log).toEqual(['b']);
    d.resolve();
    await pa;
    expect(log).toEqual(['b', 'a']);
  });
});
