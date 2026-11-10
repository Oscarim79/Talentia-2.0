/**
 * Avisos de error para el usuario, sin ventanas del navegador (alert/confirm no funcionan en
 * navegadores integrados, como el de Claude, y bloquean la página).
 *
 * `notifyError(mensaje)` se puede llamar desde cualquier lado (contextos, páginas, funciones);
 * el componente <Notices /> (montado en App) se suscribe y muestra los avisos como tarjetas
 * que se cierran solas a los 10 segundos o con el botón de cerrar.
 */

export interface Notice {
  id: number;
  message: string;
}

export const NOTICE_AUTO_DISMISS_MS = 10_000;

let notices: Notice[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Muestra un aviso de error. Si el mismo mensaje sigue visible, no lo repite. */
export function notifyError(message: string): void {
  if (notices.some((n) => n.message === message)) return;
  const id = ++seq;
  notices = [...notices, { id, message }];
  timers.set(
    id,
    setTimeout(() => dismissNotice(id), NOTICE_AUTO_DISMISS_MS),
  );
  if (listeners.size === 0) console.error('[talentia] ' + message);
  emit();
}

/** Cierra un aviso (botón de cerrar o cierre automático). */
export function dismissNotice(id: number): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  if (!notices.some((n) => n.id === id)) return;
  notices = notices.filter((n) => n.id !== id);
  emit();
}

/** Lista actual (misma referencia mientras nada cambie: apta para useSyncExternalStore). */
export function getNotices(): Notice[] {
  return notices;
}

export function subscribeNotices(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Solo para pruebas. */
export function clearNotices(): void {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  notices = [];
}
