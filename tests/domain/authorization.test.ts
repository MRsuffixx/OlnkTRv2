import { describe, expect, it } from "vitest";
import {
  canAssignRole,
  canManageRole,
  hasPermission,
} from "~/server/security/authorization";

describe("central permissions", () => {
  it("keeps moderator and admin boundaries distinct", () => {
    expect(hasPermission("MODERATOR", "PROFILE_MODERATE")).toBe(true);
    expect(hasPermission("MODERATOR", "USER_SUSPEND")).toBe(true);
    expect(hasPermission("ADMIN", "USER_SUSPEND")).toBe(true);
  });

  it("prevents staff from moderating peers or higher roles", () => {
    expect(canManageRole("MODERATOR", "USER")).toBe(true);
    expect(canManageRole("MODERATOR", "MODERATOR")).toBe(false);
    expect(canManageRole("MODERATOR", "ADMIN")).toBe(false);
    expect(canManageRole("ADMIN", "MODERATOR")).toBe(true);
    expect(canManageRole("ADMIN", "ADMIN")).toBe(false);
    expect(canManageRole("SUPER_ADMIN", "ADMIN")).toBe(true);
    expect(canManageRole("SUPER_ADMIN", "SUPER_ADMIN")).toBe(false);
  });

  it("limits role assignment to super administrators and lower roles", () => {
    expect(canAssignRole("ADMIN", "USER", "MODERATOR")).toBe(false);
    expect(canAssignRole("SUPER_ADMIN", "USER", "MODERATOR")).toBe(true);
    expect(canAssignRole("SUPER_ADMIN", "MODERATOR", "ADMIN")).toBe(true);
    expect(canAssignRole("SUPER_ADMIN", "ADMIN", "SUPER_ADMIN")).toBe(false);
    expect(canAssignRole("SUPER_ADMIN", "SUPER_ADMIN", "USER")).toBe(false);
  });

  it("allows super admins every declared permission", () => {
    expect(hasPermission("SUPER_ADMIN", "PLAN_MANAGE")).toBe(true);
  });
});
