export interface EntitlementGrant { featureKey: string; enabled: boolean; limit: number | null }
export interface ResolvedEntitlement { allowed: boolean; limit: number | null; remaining: number | null }

export function resolveEntitlement(grants: readonly EntitlementGrant[], featureKey: string, usage: number): ResolvedEntitlement {
  const grant = grants.find((item) => item.featureKey === featureKey);
  if (!grant?.enabled) return { allowed: false, limit: grant?.limit ?? null, remaining: grant?.limit ?? null };
  if (grant.limit === null) return { allowed: true, limit: null, remaining: null };
  const remaining = Math.max(0, grant.limit - usage);
  return { allowed: remaining > 0, limit: grant.limit, remaining };
}
