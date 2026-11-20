/**
 * Reglas y mensajes para cambiar la contraseña (pantalla del enlace del correo y
 * sección "Tu contraseña" en Configuración). Funciones puras para poder probarlas.
 */

export const MIN_PASSWORD_LENGTH = 8;

const NETWORK_MESSAGE = 'No se pudo conectar con el servidor. Si persiste, avísale a Oscar.';

/** Problema con la contraseña nueva antes de enviarla (o null si está bien). */
export function newPasswordProblem(password: string, repeat: string): string | null {
  if (!password) return 'Escribe la contraseña nueva.';
  if (password.length < MIN_PASSWORD_LENGTH) return `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (!repeat) return 'Escríbela otra vez para confirmarla.';
  if (password !== repeat) return 'Las dos contraseñas no coinciden.';
  return null;
}

/** Mensaje en español para un error de Supabase al guardar la contraseña (o null si no hubo error). */
export function updatePasswordErrorMessage(err: { message?: string; code?: string; status?: number; name?: string } | null): string | null {
  if (!err) return null;
  const msg = err.message ?? '';
  if (err.code === 'same_password' || msg.includes('different from the old password')) {
    return 'La contraseña nueva debe ser distinta de la anterior.';
  }
  if (err.code === 'weak_password' || msg.toLowerCase().includes('password should')) {
    return 'Esa contraseña es muy débil. Usa una más larga, con letras y números.';
  }
  if (err.code === 'reauthentication_needed') {
    return 'Por seguridad, cierra sesión, vuelve a entrar y cambia la contraseña enseguida.';
  }
  if (err.name === 'AuthSessionMissingError' || err.code === 'session_not_found' || err.status === 401 || err.status === 403) {
    return 'Tu sesión venció. Cierra sesión y vuelve a entrar.';
  }
  return NETWORK_MESSAGE;
}

export interface AuthRedirect {
  /** El usuario llegó desde el enlace de "restablecer contraseña" del correo. */
  recovery: boolean;
  /** El enlace del correo no sirvió (vencido o ya usado): mensaje para la pantalla de entrada. */
  linkError: string | null;
}

/**
 * Lee lo que Supabase deja en la dirección al volver desde un enlace del correo:
 * `#access_token=…&type=recovery` si funcionó, o `#error=…&error_code=otp_expired` si no.
 */
export function parseAuthRedirect(url: string): AuthRedirect {
  let params: URLSearchParams;
  try {
    const u = new URL(url);
    params = new URLSearchParams(u.hash.replace(/^#/, ''));
    for (const [k, v] of new URLSearchParams(u.search)) if (!params.has(k)) params.set(k, v);
  } catch {
    return { recovery: false, linkError: null };
  }
  const recovery = params.get('type') === 'recovery' && params.has('access_token');
  let linkError: string | null = null;
  if (params.has('error') || params.has('error_code')) {
    linkError =
      params.get('error_code') === 'otp_expired'
        ? 'El enlace del correo ya venció o ya se usó. Pídele a Oscar uno nuevo.'
        : 'No se pudo abrir el enlace del correo. Pídele a Oscar uno nuevo.';
  }
  return { recovery, linkError };
}

/** Quita de la dirección el error que dejó el enlace del correo, para que no reaparezca al recargar. */
export function stripAuthErrorFromUrl(): void {
  if (typeof window === 'undefined') return;
  const { hash, pathname, search } = window.location;
  if (/(^#|&)error(_code)?=/.test(hash)) window.history.replaceState(null, '', pathname + search);
}
