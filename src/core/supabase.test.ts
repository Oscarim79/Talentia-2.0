import { describe, expect, it } from 'vitest';
import { configError, MISSING_ENV_MESSAGE } from './supabase';

describe('configError', () => {
  it('devuelve null cuando están las dos variables', () => {
    expect(configError('https://x.supabase.co', 'clave')).toBeNull();
  });
  it('avisa si falta la URL, la clave o ambas', () => {
    expect(configError(undefined, 'clave')).toBe(MISSING_ENV_MESSAGE);
    expect(configError('https://x.supabase.co', undefined)).toBe(MISSING_ENV_MESSAGE);
    expect(configError(undefined, undefined)).toBe(MISSING_ENV_MESSAGE);
  });
  it('trata las cadenas vacías como faltantes', () => {
    expect(configError('', 'clave')).toBe(MISSING_ENV_MESSAGE);
    expect(configError('https://x.supabase.co', '')).toBe(MISSING_ENV_MESSAGE);
  });
});
