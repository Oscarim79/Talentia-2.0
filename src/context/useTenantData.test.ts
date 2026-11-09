import { describe, expect, it } from 'vitest';
import { networkMessage, nextSucceededFor, reduceLoadError, shouldReloadOnVisibility } from './useTenantData';

describe('useTenantData helpers', () => {
  it('recarga solo al volver a estar visible', () => {
    expect(shouldReloadOnVisibility('visible')).toBe(true);
    expect(shouldReloadOnVisibility('hidden')).toBe(false);
  });
  it('convierte cualquier error en el mensaje de red', () => {
    expect(networkMessage(new TypeError('Failed to fetch'))).toBe('No se pudo conectar con el servidor. Si persiste, avísale a Oscar.');
  });
});

describe('reduceLoadError', () => {
  const err = new TypeError('Failed to fetch');
  it('primera carga fallida: datos iniciales y mensaje de error', () => {
    expect(reduceLoadError(false, ['viejo'], [], err)).toEqual({ data: [], error: networkMessage(err) });
  });
  it('recarga fallida tras una carga buena: conserva los datos y no hay error', () => {
    expect(reduceLoadError(true, ['viejo'], [], err)).toEqual({ data: ['viejo'], error: null });
  });
});

describe('reduceLoadError: errores consecutivos', () => {
  it('primera carga falló y la recarga falla otra vez: el error persiste', () => {
    const err = new TypeError('Failed to fetch');
    const first = reduceLoadError(false, ['x'], [], err);
    const second = reduceLoadError(false, first.data, [], err);
    expect(second).toEqual({ data: [], error: networkMessage(err) });
  });
});

describe('A ok, B falla, A recarga y falla', () => {
  it('no queda en silencio: hay error y datos iniciales', () => {
    const err = new TypeError('Failed to fetch');
    let succeeded: string | null = null;
    succeeded = nextSucceededFor(succeeded, 'A', true); // A carga bien
    expect(succeeded).toBe('A');
    succeeded = nextSucceededFor(succeeded, 'B', false); // B falla: vacía los datos
    expect(succeeded).toBeNull();
    const hasLoaded = succeeded === 'A'; // A recarga y falla
    expect(hasLoaded).toBe(false);
    expect(reduceLoadError(hasLoaded, [], [], err)).toEqual({ data: [], error: networkMessage(err) });
  });
  it('un fallo de la misma empresa con éxito previo conserva el éxito', () => {
    expect(nextSucceededFor('A', 'A', false)).toBe('A');
  });
});
