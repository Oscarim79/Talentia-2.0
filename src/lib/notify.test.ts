import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearNotices,
  dismissNotice,
  flushPendingNotice,
  getNotices,
  notifyAfterReload,
  notifyError,
  notifySuccess,
  subscribeNotices,
} from './notify';

/** sessionStorage de mentira (las pruebas corren en Node, sin navegador). */
function fakeSessionStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    size: () => store.size,
  };
}

describe('avisos de error en la app (notify)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearNotices();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('notifyError agrega un aviso y avisa a quien está suscrito', () => {
    const listener = vi.fn();
    subscribeNotices(listener);
    notifyError('No se pudo guardar.');
    expect(getNotices()).toHaveLength(1);
    expect(getNotices()[0].message).toBe('No se pudo guardar.');
    expect(getNotices()[0].tone).toBe('error');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifySuccess agrega un aviso con tono de éxito', () => {
    notifySuccess('Listo.');
    expect(getNotices()[0]).toMatchObject({ message: 'Listo.', tone: 'success' });
  });

  it('no repite el mismo mensaje mientras sigue visible', () => {
    notifyError('No se pudo guardar.');
    notifyError('No se pudo guardar.');
    expect(getNotices()).toHaveLength(1);
    notifyError('Otro error.');
    expect(getNotices()).toHaveLength(2);
  });

  it('dismissNotice quita el aviso y avisa a los suscritos', () => {
    const listener = vi.fn();
    subscribeNotices(listener);
    notifyError('Uno');
    const id = getNotices()[0].id;
    dismissNotice(id);
    expect(getNotices()).toHaveLength(0);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('el aviso se cierra solo a los 10 segundos', () => {
    notifyError('Temporal');
    vi.advanceTimersByTime(9_999);
    expect(getNotices()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(getNotices()).toHaveLength(0);
  });

  it('getNotices devuelve la misma referencia si nada cambió (para useSyncExternalStore)', () => {
    notifyError('A');
    const a = getNotices();
    expect(getNotices()).toBe(a);
    notifyError('B');
    expect(getNotices()).not.toBe(a);
  });

  it('al desuscribirse deja de avisar', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeNotices(listener);
    unsubscribe();
    notifyError('Sin oyentes');
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifyAfterReload guarda el aviso y flushPendingNotice lo muestra una sola vez', () => {
    const storage = fakeSessionStorage();
    vi.stubGlobal('sessionStorage', storage);
    notifyAfterReload('Listo: la demo volvió a los datos de ejemplo.');
    expect(getNotices()).toHaveLength(0); // todavía no se muestra: se mostrará tras recargar
    expect(storage.size()).toBe(1);
    flushPendingNotice();
    expect(getNotices()).toHaveLength(1);
    expect(getNotices()[0]).toMatchObject({ message: 'Listo: la demo volvió a los datos de ejemplo.', tone: 'success' });
    expect(storage.size()).toBe(0);
    flushPendingNotice();
    expect(getNotices()).toHaveLength(1);
  });

  it('notifyAfterReload acepta tono de error', () => {
    vi.stubGlobal('sessionStorage', fakeSessionStorage());
    notifyAfterReload('Falló.', 'error');
    flushPendingNotice();
    expect(getNotices()[0].tone).toBe('error');
  });

  it('sin sessionStorage (o con basura guardada) no truena', () => {
    expect(() => notifyAfterReload('x')).not.toThrow();
    expect(() => flushPendingNotice()).not.toThrow();
    const storage = fakeSessionStorage();
    vi.stubGlobal('sessionStorage', storage);
    storage.setItem('talentia.notice.v1', '{no es json');
    expect(() => flushPendingNotice()).not.toThrow();
    expect(getNotices()).toHaveLength(0);
  });
});
