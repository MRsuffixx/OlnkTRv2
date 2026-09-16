export type Role = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
export type Permission = "PROFILE_MODERATE" | "REPORT_REVIEW" | "USER_SUSPEND" | "ROLE_MANAGE" | "PLAN_MANAGE" | "FLAG_MANAGE" | "AUDIT_READ";

const permissions: Record<Role, ReadonlySet<Permission>> = {
  USER: new Set(),
  MODERATOR: new Set(["PROFILE_MODERATE", "REPORT_REVIEW"]),
  ADMIN: new Set(["PROFILE_MODERATE", "REPORT_REVIEW", "USER_SUSPEND", "FLAG_MANAGE", "AUDIT_READ"]),
  SUPER_ADMIN: new Set(["PROFILE_MODERATE", "REPORT_REVIEW", "USER_SUSPEND", "ROLE_MANAGE", "PLAN_MANAGE", "FLAG_MANAGE", "AUDIT_READ"]),
};

export function hasPermission(role: Role, permission: Permission): boolean { return permissions[role].has(permission); }
export function hasRole(role: Role, minimum: Role): boolean { return ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"].indexOf(role) >= ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"].indexOf(minimum); }
