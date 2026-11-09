import { describe, expect, it } from 'vitest';
import { networkMessage, reduceLoadError, shouldReloadOnVisibility } from './useTenantData';

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
