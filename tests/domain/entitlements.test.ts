import { describe, expect, it } from "vitest";
import { resolveEntitlement } from "~/server/entitlements/resolver";

describe("entitlement resolution", () => {
  it("denies a missing free capability", () => {
    expect(resolveEntitlement([], "CUSTOM_DOMAIN", 0)).toEqual({ allowed: false, limit: null, remaining: null });
  });

  it("allows a premium boolean capability", () => {
    expect(resolveEntitlement([{ featureKey: "CUSTOM_DOMAIN", enabled: true, limit: null }], "CUSTOM_DOMAIN", 0).allowed).toBe(true);
  });

  it("enforces numeric limits", () => {
    expect(resolveEntitlement([{ featureKey: "BLOCKS", enabled: true, limit: 15 }], "BLOCKS", 15)).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("treats null limits as unlimited", () => {
    expect(resolveEntitlement([{ featureKey: "BLOCKS", enabled: true, limit: null }], "BLOCKS", 10_000).allowed).toBe(true);
  });
});
