import { describe, expect, it } from 'vitest';
import { TENANTS } from '../../data/seed';
import { rowToTenant, type TenantRow } from './tenants';

describe('tenants mapper', () => {
  it('convierte una fila completa a Tenant', () => {
    const t = TENANTS[0];
    const row: TenantRow = {
      id: t.id, name: t.name, slug: t.slug, logo_emoji: t.logoEmoji, industry: t.industry,
      brands: t.brands, plan_id: t.planId, status: t.status, created_at: t.createdAt,
    };
    expect(rowToTenant(row)).toEqual(t);
  });
  it('los campos nulos caen a valores vacíos', () => {
    const row: TenantRow = {
      id: 'x', name: 'X', slug: 'x', logo_emoji: null, industry: null,
      brands: null, plan_id: null, status: null, created_at: null,
    };
    const t = rowToTenant(row);
    expect(t.brands).toEqual([]);
    expect(t.logoEmoji).toBe('');
    expect(t.planId).toBe('');
    expect(t.status).toBe('active');
  });
});
