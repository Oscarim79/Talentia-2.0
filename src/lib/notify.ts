/**
 * Avisos para el usuario, sin ventanas del navegador (alert/confirm no funcionan en
 * navegadores integrados, como el de Claude, y bloquean la página).
 *
 * `notifyError(mensaje)` y `notifySuccess(mensaje)` se pueden llamar desde cualquier lado
 * (contextos, páginas, funciones); el componente <Notices /> (montado en App) se suscribe y
 * muestra los avisos como tarjetas que se cierran solas a los 10 segundos o con el botón de cerrar.
 *
 * `notifyAfterReload(mensaje)` deja el aviso guardado para mostrarlo después de recargar la
 * página (misma pestaña): <Notices /> lo recoge al montarse con `flushPendingNotice()`.
 */

export type NoticeTone = 'error' | 'success';

export interface Notice {
  id: number;
  message: string;
  tone: NoticeTone;
}

export const NOTICE_AUTO_DISMISS_MS = 10_000;
const PENDING_KEY = 'talentia.notice.v1';

let notices: Notice[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit(): void {
  for (const listener of listeners) listener();
}

function push(message: string, tone: NoticeTone): void {
  if (notices.some((n) => n.message === message)) return; // el mismo mensaje sigue visible
  const id = ++seq;
  notices = [...notices, { id, message, tone }];
  timers.set(
    id,
    setTimeout(() => dismissNotice(id), NOTICE_AUTO_DISMISS_MS),
  );
  if (listeners.size === 0 && tone === 'error') console.error('[talentia] ' + message);
  emit();
}

/** Muestra un aviso de error. */
export function notifyError(message: string): void {
  push(message, 'error');
}

/** Muestra un aviso de que algo salió bien. */
export function notifySuccess(message: string): void {
  push(message, 'success');
}

/** Guarda un aviso para mostrarlo tras recargar la página (misma pestaña). */
export function notifyAfterReload(message: string, tone: NoticeTone = 'success'): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ message, tone }));
  } catch {
    // Sin almacenamiento disponible: el aviso simplemente no se mostrará.
  }
}

/** Muestra el aviso pendiente de una recarga, si lo hay. Lo llama <Notices /> al montarse. */
export function flushPendingNotice(): void {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_KEY);
    const parsed = JSON.parse(raw) as { message?: unknown; tone?: unknown };
    if (typeof parsed.message !== 'string' || !parsed.message) return;
    push(parsed.message, parsed.tone === 'error' ? 'error' : 'success');
  } catch {
    // Sin almacenamiento o contenido inválido: no hay nada que mostrar.
  }
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
