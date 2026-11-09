import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen } from '../../components/StatusScreens';
import LoginPage from './LoginPage';

export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') return <LoadingScreen label="Entrando…" />;
  if (status === 'signed_out') return <LoginPage />;
  return <>{children}</>;
}
