import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { TENANTS, PLANS } from '../data/seed';
import type { Tenant, Plan } from '../types';

interface TenantCtxValue {
  tenant: Tenant;
  plan: Plan;
  tenants: Tenant[];
  setTenantId: (id: string) => void;
}

const TenantContext = createContext<TenantCtxValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState(TENANTS[0].id);

  const value = useMemo<TenantCtxValue>(() => {
    const tenant = TENANTS.find((t) => t.id === tenantId) ?? TENANTS[0];
    const plan = PLANS.find((p) => p.id === tenant.planId) ?? PLANS[0];
    return { tenant, plan, tenants: TENANTS, setTenantId };
  }, [tenantId]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant debe usarse dentro de <TenantProvider>');
  return ctx;
}
