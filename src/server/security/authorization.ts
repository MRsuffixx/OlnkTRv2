export type Role = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
export type Permission =
  | "PROFILE_MODERATE"
  | "REPORT_REVIEW"
  | "USER_SUSPEND"
  | "ROLE_MANAGE"
  | "PLAN_MANAGE"
  | "FLAG_MANAGE"
  | "AUDIT_READ";

export const roles: readonly Role[] = [
  "USER",
  "MODERATOR",
  "ADMIN",
  "SUPER_ADMIN",
];

export const permissionKeys: readonly Permission[] = [
  "PROFILE_MODERATE",
  "REPORT_REVIEW",
  "USER_SUSPEND",
  "ROLE_MANAGE",
  "PLAN_MANAGE",
  "FLAG_MANAGE",
  "AUDIT_READ",
];

const permissions: Record<Role, ReadonlySet<Permission>> = {
  USER: new Set(),
  MODERATOR: new Set([
    "PROFILE_MODERATE",
    "REPORT_REVIEW",
    "USER_SUSPEND",
  ]),
  ADMIN: new Set([
    "PROFILE_MODERATE",
    "REPORT_REVIEW",
    "USER_SUSPEND",
    "FLAG_MANAGE",
    "AUDIT_READ",
  ]),
  SUPER_ADMIN: new Set(permissionKeys),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissions[role].has(permission);
}

export function permissionsForRole(role: Role): Permission[] {
  return permissionKeys.filter((permission) => hasPermission(role, permission));
}

export function hasRole(role: Role, minimum: Role): boolean {
  return roles.indexOf(role) >= roles.indexOf(minimum);
}

export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  return (
    hasPermission(actorRole, "USER_SUSPEND") &&
    roles.indexOf(actorRole) > roles.indexOf(targetRole)
  );
}

export function canAssignRole(
  actorRole: Role,
  targetRole: Role,
  nextRole: Role,
): boolean {
  return (
    hasPermission(actorRole, "ROLE_MANAGE") &&
    targetRole !== "SUPER_ADMIN" &&
    nextRole !== "SUPER_ADMIN"
  );
}
