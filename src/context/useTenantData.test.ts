import { describe, expect, it } from 'vitest';
import { networkMessage, shouldReloadOnVisibility } from './useTenantData';

describe('useTenantData helpers', () => {
  it('recarga solo al volver a estar visible', () => {
    expect(shouldReloadOnVisibility('visible')).toBe(true);
    expect(shouldReloadOnVisibility('hidden')).toBe(false);
  });
  it('convierte cualquier error en el mensaje de red', () => {
    expect(networkMessage(new TypeError('Failed to fetch'))).toBe('No se pudo conectar con el servidor. Si persiste, avísale a Oscar.');
  });
});
