import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen } from '../../components/StatusScreens';
import LoginPage from './LoginPage';
import NewPasswordPage from './NewPasswordPage';

export function AuthGate({ children }: { children: ReactNode }) {
  const { status, recovering } = useAuth();
  if (status === 'loading') return <LoadingScreen label="Entrando…" />;
  if (status === 'signed_out') return <LoginPage />;
  if (recovering) return <NewPasswordPage />;
  return <>{children}</>;
}
