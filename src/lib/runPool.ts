/**
 * Ejecuta `worker` sobre cada elemento con como máximo `limit` tareas en vuelo.
 * Resuelve cuando todas terminaron. Un trabajador que falla no detiene a los
 * demás: el error se anota en consola y se sigue con el siguiente.
 */
export async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  const lanes = Math.max(1, Math.min(limit, items.length));
  const lane = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        await worker(items[i], i);
      } catch (err) {
        console.error('runPool: tarea fallida', err);
      }
    }
  };
  await Promise.all(Array.from({ length: lanes }, lane));
}
