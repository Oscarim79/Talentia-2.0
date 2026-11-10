import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearNotices, dismissNotice, getNotices, notifyError, subscribeNotices } from './notify';

describe('avisos de error en la app (notify)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearNotices();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('notifyError agrega un aviso y avisa a quien está suscrito', () => {
    const listener = vi.fn();
    subscribeNotices(listener);
    notifyError('No se pudo guardar.');
    expect(getNotices()).toHaveLength(1);
    expect(getNotices()[0].message).toBe('No se pudo guardar.');
    expect(listener).toHaveBeenCalledTimes(1);
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
});
