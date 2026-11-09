import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PLANS } from '../data/seed';
import { listMyTenants } from '../core/db/tenants';
import { listMyMemberships } from '../core/db/members';
import { canManage as canManageRole } from '../core/roles';
import { useAuth } from './AuthContext';
import { LoadingScreen, ErrorScreen } from '../components/StatusScreens';
import NoTenantPage from '../features/auth/NoTenantPage';
import type { Tenant, Plan, User } from '../types';

interface TenantCtxValue {
  tenant: Tenant;
  plan: Plan;
  tenants: Tenant[];
  setTenantId: (id: string) => void;
  member: User;
  canManage: boolean;
  memberships: User[];
}

const TenantContext = createContext<TenantCtxValue | null>(null);

const STORAGE_KEY = 'talentia.tenant.v1';

function readStoredTenantId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { email, signOut } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [memberships, setMemberships] = useState<User[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [tenantId, setTenantIdState] = useState<string | null>(readStoredTenantId);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    setLoaded(false);
    setFailed(false);
    Promise.all([listMyTenants(), listMyMemberships(email)]).then(
      ([ts, ms]) => {
        if (cancelled) return;
        setTenants(ts);
        setMemberships(ms);
        setLoaded(true);
      },
      () => {
        if (cancelled) return;
        setFailed(true);
        setLoaded(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [email, attempt]);

  const setTenantId = useCallback((id: string) => {
    setTenantIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* sin almacenamiento: la elección vale solo para esta visita */
    }
  }, []);

  // Solo empresas donde la persona tiene membresía.
  const myTenants = useMemo(
    () => tenants.filter((t) => memberships.some((m) => m.tenantId === t.id)),
    [tenants, memberships],
  );

  const value = useMemo<TenantCtxValue | null>(() => {
    const tenant = myTenants.find((t) => t.id === tenantId) ?? myTenants[0];
    if (!tenant) return null;
    const member = memberships.find((m) => m.tenantId === tenant.id);
    if (!member) return null;
    const plan = PLANS.find((p) => p.id === tenant.planId) ?? PLANS[0];
    return {
      tenant,
      plan,
      tenants: myTenants,
      setTenantId,
      member,
      canManage: canManageRole(member.role),
      memberships,
    };
  }, [myTenants, memberships, tenantId, setTenantId]);

  if (!loaded) return <LoadingScreen label="Cargando tu empresa…" />;
  if (failed) {
    return (
      <ErrorScreen
        message="No se pudo conectar con el servidor. Si persiste, avísale a Oscar."
        onRetry={() => setAttempt((n) => n + 1)}
        onSignOut={() => void signOut()}
      />
    );
  }
  if (!value) return <NoTenantPage />;

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant debe usarse dentro de <TenantProvider>');
  return ctx;
}
