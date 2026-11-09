import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../core/supabase';
import { notifyError } from '../lib/notify';

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in';

interface AuthCtxValue {
  status: AuthStatus;
  email: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const NETWORK_MESSAGE = 'No se pudo conectar con el servidor. Si persiste, avísale a Oscar.';

/** Correo sin espacios y en minúsculas. */
export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

/** Mensaje en español para un error de inicio de sesión (o null si no hubo error). */
export function loginErrorMessage(err: { message?: string; status?: number } | null): string | null {
  if (!err) return null;
  if (err.status === 400 || err.message?.includes('Invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  return NETWORK_MESSAGE;
}

const AuthContext = createContext<AuthCtxValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const apply = (session: { user: { email?: string | null } } | null) => {
      if (!active) return;
      setEmail(session?.user.email ? normalizeEmail(session.user.email) : null);
      setStatus(session ? 'signed_in' : 'signed_out');
    };
    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session))
      .catch(() => apply(null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthCtxValue>(
    () => ({
      status,
      email,
      signIn: async (mail, password) => {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(mail), password });
          return loginErrorMessage(error);
        } catch {
          return NETWORK_MESSAGE;
        }
      },
      signOut: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
        } catch {
          // Sin red o con el proyecto pausado el cierre global falla y la sesión
          // local seguiría abierta. Se cierra solo en este navegador (la sesión
          // del servidor sigue hasta que venza).
          try {
            const { error } = await supabase.auth.signOut({ scope: 'local' });
            if (error) throw error;
          } catch {
            notifyError('No se pudo cerrar la sesión. Revisa tu conexión e inténtalo de nuevo.');
          }
        }
      },
    }),
    [status, email],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
