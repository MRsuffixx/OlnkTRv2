export type WidgetStatus =
  | "AVAILABLE"
  | "STALE"
  | "UNAVAILABLE"
  | "MISCONFIGURED";

export type WidgetPayload = Record<string, unknown> & {
  status: WidgetStatus;
  available: boolean;
  updatedAt: string | null;
};

export function normalizeWidgetPayload<T extends Record<string, unknown>>(
  payload: T,
  updatedAt = new Date(),
): T & WidgetPayload {
  const available = payload.available !== false;
  return {
    ...payload,
    available,
    status: available ? "AVAILABLE" : "MISCONFIGURED",
    updatedAt: updatedAt.toISOString(),
  };
}

export function resolveWidgetCache(
  fresh: WidgetPayload | null,
  stale: WidgetPayload | null,
  fallback: Record<string, unknown>,
): { delivery: WidgetPayload; refresh: boolean } {
  if (fresh) return { delivery: fresh, refresh: false };
  if (stale) {
    return {
      delivery: { ...stale, status: "STALE" },
      refresh: true,
    };
  }
  return {
    delivery: {
      ...fallback,
      available: false,
      status: "UNAVAILABLE",
      updatedAt: null,
    },
    refresh: true,
  };
}
