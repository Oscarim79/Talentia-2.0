import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { newPasswordProblem, parseAuthRedirect, updatePasswordErrorMessage } from './password';
import { NewPasswordForm } from './NewPasswordForm';

const BASE = 'https://talentialabs.app/';

describe('parseAuthRedirect (lo que deja Supabase al volver del correo)', () => {
  it('enlace de restablecer contraseña que funcionó', () => {
    const r = parseAuthRedirect(`${BASE}#access_token=abc&expires_in=3600&refresh_token=xyz&token_type=bearer&type=recovery`);
    expect(r).toEqual({ recovery: true, linkError: null });
  });

  it('enlace vencido o ya usado', () => {
    const r = parseAuthRedirect(`${BASE}#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`);
    expect(r.recovery).toBe(false);
    expect(r.linkError).toContain('venció o ya se usó');
  });

  it('otro error del enlace', () => {
    expect(parseAuthRedirect(`${BASE}?error=server_error`).linkError).toContain('No se pudo abrir el enlace');
  });

  it('dirección normal o enlace de invitación: nada especial', () => {
    expect(parseAuthRedirect(`${BASE}candidatos`)).toEqual({ recovery: false, linkError: null });
    expect(parseAuthRedirect(`${BASE}#access_token=abc&type=invite`)).toEqual({ recovery: false, linkError: null });
    expect(parseAuthRedirect(`${BASE}#type=recovery`).recovery).toBe(false); // sin token no hay sesión
    expect(parseAuthRedirect('no es una url')).toEqual({ recovery: false, linkError: null });
  });
});

describe('newPasswordProblem', () => {
  it('pide la contraseña, el largo mínimo, repetirla y que coincidan', () => {
    expect(newPasswordProblem('', '')).toBe('Escribe la contraseña nueva.');
    expect(newPasswordProblem('corta', 'corta')).toBe('Debe tener al menos 8 caracteres.');
    expect(newPasswordProblem('larga1234', '')).toBe('Escríbela otra vez para confirmarla.');
    expect(newPasswordProblem('larga1234', 'larga12345')).toBe('Las dos contraseñas no coinciden.');
    expect(newPasswordProblem('larga1234', 'larga1234')).toBeNull();
  });
});

describe('updatePasswordErrorMessage', () => {
  it('traduce los errores de Supabase', () => {
    expect(updatePasswordErrorMessage(null)).toBeNull();
    expect(updatePasswordErrorMessage({ code: 'same_password', status: 422 })).toContain('distinta de la anterior');
    expect(updatePasswordErrorMessage({ message: 'New password should be different from the old password.' })).toContain('distinta');
    expect(updatePasswordErrorMessage({ code: 'weak_password', status: 422 })).toContain('muy débil');
    expect(updatePasswordErrorMessage({ code: 'reauthentication_needed' })).toContain('vuelve a entrar');
    expect(updatePasswordErrorMessage({ name: 'AuthSessionMissingError', message: 'Auth session missing!' })).toContain('sesión venció');
    expect(updatePasswordErrorMessage({ status: 500, message: 'boom' })).toContain('No se pudo conectar');
  });
});

describe('NewPasswordForm', () => {
  const html = (inline: boolean) => renderToStaticMarkup(createElement(NewPasswordForm, { onSave: async () => null, inline }));

  it('dos campos de contraseña nueva (el navegador ofrece guardarla) y su botón', () => {
    const page = html(false);
    expect(page.match(/autoComplete="new-password"|autocomplete="new-password"/g)).toHaveLength(2);
    expect(page).toContain('Contraseña nueva');
    expect(page).toContain('Repítela');
    expect(page).toContain('Al menos 8 caracteres.');
    expect(page).toContain('Guardar y entrar');
  });

  it('en Configuración el botón dice "Guardar contraseña"', () => {
    const page = html(true);
    expect(page).toContain('Guardar contraseña');
    expect(page).not.toContain('Guardar y entrar');
  });
});
