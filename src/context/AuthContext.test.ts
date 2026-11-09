import { describe, expect, it } from 'vitest';
import { loginErrorMessage, normalizeEmail } from './AuthContext';

describe('AuthContext helpers', () => {
  it('normaliza el correo (espacios y mayúsculas)', () => {
    expect(normalizeEmail(' Rrhh@Americana2000.com.gt ')).toBe('rrhh@americana2000.com.gt');
  });
  it('credenciales incorrectas', () => {
    expect(loginErrorMessage({ status: 400, message: 'x' })).toBe('Correo o contraseña incorrectos.');
    expect(loginErrorMessage({ message: 'Invalid login credentials' })).toBe('Correo o contraseña incorrectos.');
  });
  it('otros errores y sin error', () => {
    expect(loginErrorMessage({ status: 500, message: 'boom' })).toBe('No se pudo conectar con el servidor. Si persiste, avísale a Oscar.');
    expect(loginErrorMessage(null)).toBeNull();
  });
});
