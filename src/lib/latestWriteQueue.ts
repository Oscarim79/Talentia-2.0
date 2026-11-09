/**
 * Serializa escrituras por clave: nunca hay dos a la vez para la misma clave y,
 * si llegan varias mientras una corre, solo se conserva la última (lleva el
 * estado más reciente). La promesa de una tarea reemplazada se resuelve.
 */
export interface LatestWriteQueue {
  run(key: string, task: () => Promise<void>): Promise<void>;
}

interface Pending {
  task: () => Promise<void>;
  resolve: () => void;
  reject: (e: unknown) => void;
}

export function createLatestWriteQueue(): LatestWriteQueue {
  const running = new Map<string, true>();
  const pending = new Map<string, Pending>();

  async function drain(key: string, first: Pending) {
    let cur: Pending | undefined = first;
    while (cur) {
      try {
        await cur.task();
        cur.resolve();
      } catch (e) {
        cur.reject(e);
      }
      cur = pending.get(key);
      pending.delete(key);
    }
    running.delete(key);
  }

  return {
    run(key, task) {
      return new Promise<void>((resolve, reject) => {
        const entry: Pending = { task, resolve, reject };
        if (running.has(key)) {
          pending.get(key)?.resolve(); // la reemplazada ya está cubierta por la nueva
          pending.set(key, entry);
        } else {
          running.set(key, true);
          void drain(key, entry);
        }
      });
    },
  };
}
