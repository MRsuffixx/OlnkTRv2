import { describe, expect, it } from "vitest";
import { hasPermission } from "~/server/security/authorization";

describe("central permissions", () => {
  it("keeps moderator and admin boundaries distinct", () => {
    expect(hasPermission("MODERATOR", "PROFILE_MODERATE")).toBe(true);
    expect(hasPermission("MODERATOR", "USER_SUSPEND")).toBe(false);
    expect(hasPermission("ADMIN", "USER_SUSPEND")).toBe(true);
  });

  it("allows super admins every declared permission", () => {
    expect(hasPermission("SUPER_ADMIN", "PLAN_MANAGE")).toBe(true);
  });
});
