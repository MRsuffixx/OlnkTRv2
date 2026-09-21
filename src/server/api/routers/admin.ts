import { z } from "zod";

import {
  changeUserRole,
  getManagedUserDetail,
  setProfileModeration,
  setUserSuspended,
  staffActionReasonSchema,
} from "~/server/admin/user-management";
import {
  ADMIN_USERS_PAGE_SIZE,
  resolveAdminUsersPagination,
} from "~/server/admin/user-pagination";
import {
  grantManualPremium,
  manualPremiumGrantSchema,
} from "~/server/billing/manual-subscription";
import { AppError } from "~/server/errors";
import { usernameFormatSchema } from "~/server/profile/username";
import { enqueueEntitlementRefresh } from "~/server/queues";
import {
  canManageRole,
  hasPermission,
  permissionKeys,
  permissionsForRole,
  roles,
  type Permission,
  type Role,
} from "~/server/security/authorization";
import { rateLimit } from "~/server/security/rate-limit";
import {
  adminProcedure,
  createTRPCRouter,
  staffProcedure,
} from "../trpc";

const confirmation = z.literal("CONFIRM");
const assignableRoleSchema = z.enum(["USER", "MODERATOR", "ADMIN"]);

function requirePermission(role: Role, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new AppError("FORBIDDEN", "Permission denied");
  }
}

async function limitStaffAction(userId: string) {
  const result = await rateLimit("staff-action", userId, 120, 3_600);
  if (!result.allowed) {
    throw new AppError(
      "RATE_LIMITED",
      "Too many staff actions. Try again later.",
    );
  }
}

export const adminRouter = createTRPCRouter({
  users: staffProcedure
    .input(
      z.object({
        query: z.string().trim().max(100).default(""),
        role: assignableRoleSchema.optional(),
        status: z
          .enum(["ACTIVE", "SUSPENDED", "DISABLED", "DELETION_PENDING"])
          .optional(),
        page: z.number().int().positive().default(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const manageableRoles = roles.filter((role) =>
        canManageRole(ctx.session.user.role, role),
      );
      const requestedRole =
        input.role && manageableRoles.includes(input.role)
          ? input.role
          : undefined;
      const where = {
        role: requestedRole ?? { in: manageableRoles },
        ...(input.status ? { status: input.status } : {}),
        ...(input.query
          ? {
              OR: [
                { email: { contains: input.query, mode: "insensitive" as const } },
                { name: { contains: input.query, mode: "insensitive" as const } },
                {
                  profiles: {
                    some: {
                      username: {
                        contains: input.query,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      };
      const total = await ctx.db.user.count({ where });
      const pagination = resolveAdminUsersPagination(input.page, total);
      const items = await ctx.db.user.findMany({
        where,
        skip: pagination.skip,
        take: ADMIN_USERS_PAGE_SIZE,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          status: true,
          onboardingStatus: true,
          createdAt: true,
          profiles: {
            select: {
              id: true,
              username: true,
              displayName: true,
              status: true,
            },
          },
          subscriptions: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: {
              status: true,
              currentPeriodEnd: true,
              provider: true,
              plan: { select: { key: true, name: true } },
            },
          },
        },
      });
      return {
        items,
        total,
        page: pagination.page,
        pageCount: pagination.pageCount,
        pageSize: pagination.pageSize,
      };
    }),

  userDetail: staffProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      getManagedUserDetail(ctx.session.user.id, input.userId),
    ),

  permissionMatrix: staffProcedure.query(({ ctx }) => ({
    currentRole: ctx.session.user.role,
    permissions: permissionKeys,
    roles: roles.map((role) => ({
      role,
      permissions: permissionsForRole(role),
    })),
  })),

  setSuspended: staffProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        suspended: z.boolean(),
        reason: staffActionReasonSchema,
        confirmation,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await limitStaffAction(ctx.session.user.id);
      return setUserSuspended({
        actorId: ctx.session.user.id,
        targetUserId: input.userId,
        suspended: input.suspended,
        reason: input.reason,
      });
    }),

  setProfileHidden: staffProcedure
    .input(
      z.object({
        profileId: z.string().cuid(),
        hidden: z.boolean(),
        reason: staffActionReasonSchema,
        confirmation,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await limitStaffAction(ctx.session.user.id);
      return setProfileModeration({
        actorId: ctx.session.user.id,
        profileId: input.profileId,
        hidden: input.hidden,
        reason: input.reason,
      });
    }),

  setRole: staffProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        role: assignableRoleSchema,
        reason: staffActionReasonSchema,
        confirmation,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await limitStaffAction(ctx.session.user.id);
      return changeUserRole({
        actorId: ctx.session.user.id,
        targetUserId: input.userId,
        role: input.role,
        reason: input.reason,
      });
    }),

  grantPremiumMonths: adminProcedure
    .input(manualPremiumGrantSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx.session.user.role, "PLAN_MANAGE");
      const target = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { role: true },
      });
      if (!target) throw new AppError("NOT_FOUND", "User not found");
      if (
        input.userId === ctx.session.user.id ||
        !canManageRole(ctx.session.user.role, target.role)
      ) {
        throw new AppError("FORBIDDEN", "You cannot manage this subscription");
      }
      await limitStaffAction(ctx.session.user.id);
      const subscription = await grantManualPremium({
        ...input,
        actorId: ctx.session.user.id,
      });
      await enqueueEntitlementRefresh(
        input.userId,
        `manual-${subscription.updatedAt.getTime()}`,
      );
      if (subscription.currentPeriodEnd) {
        await enqueueEntitlementRefresh(
          input.userId,
          `expiry-${subscription.currentPeriodEnd.getTime()}`,
          Math.max(0, subscription.currentPeriodEnd.getTime() - Date.now()),
        );
      }
      return subscription;
    }),

  flags: adminProcedure.query(({ ctx }) =>
    ctx.db.featureFlag.findMany({ orderBy: { key: "asc" } }),
  ),

  setFlag: adminProcedure
    .input(z.object({ key: z.string().min(2).max(80), enabled: z.boolean() }))
    .mutation(({ ctx, input }) => {
      requirePermission(ctx.session.user.role, "FLAG_MANAGE");
      return ctx.db.$transaction(async (tx) => {
        const flag = await tx.featureFlag.upsert({
          where: { key: input.key },
          create: input,
          update: { enabled: input.enabled },
        });
        await tx.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            actorType: "ADMIN",
            action: "FEATURE_FLAG_UPDATED",
            targetType: "FeatureFlag",
            targetId: flag.id,
            metadata: { enabled: input.enabled },
          },
        });
        return flag;
      });
    }),

  reservedUsernames: adminProcedure.query(({ ctx }) =>
    ctx.db.reservedUsername.findMany({ orderBy: { username: "asc" } }),
  ),

  reserveUsername: adminProcedure
    .input(
      z.object({
        username: usernameFormatSchema,
        reason: z.string().min(2).max(200),
      }),
    )
    .mutation(({ ctx, input }) => {
      requirePermission(ctx.session.user.role, "FLAG_MANAGE");
      return ctx.db.$transaction(async (tx) => {
        const value = await tx.reservedUsername.upsert({
          where: { username: input.username },
          create: { ...input, createdBy: ctx.session.user.id },
          update: { reason: input.reason },
        });
        await tx.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            actorType: "ADMIN",
            action: "USERNAME_RESERVED",
            targetType: "ReservedUsername",
            targetId: value.username,
          },
        });
        return value;
      });
    }),

  releaseUsername: adminProcedure
    .input(z.object({ username: usernameFormatSchema, confirmation }))
    .mutation(({ ctx, input }) => {
      requirePermission(ctx.session.user.role, "FLAG_MANAGE");
      return ctx.db.$transaction(async (tx) => {
        const result = await tx.reservedUsername.deleteMany({
          where: { username: input.username },
        });
        await tx.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            actorType: "ADMIN",
            action: "USERNAME_RELEASED",
            targetType: "ReservedUsername",
            targetId: input.username,
          },
        });
        return result;
      });
    }),

  catalog: adminProcedure.query(({ ctx }) =>
    ctx.db.plan.findMany({
      orderBy: { sortOrder: "asc" },
      include: { entitlements: { include: { feature: true } } },
    }),
  ),

  setPlanEntitlement: adminProcedure
    .input(
      z.object({
        planKey: z.string(),
        featureKey: z.string(),
        enabled: z.boolean(),
        limit: z.number().int().nonnegative().nullable(),
        confirmation,
      }),
    )
    .mutation(({ ctx, input }) => {
      requirePermission(ctx.session.user.role, "PLAN_MANAGE");
      return ctx.db.$transaction(async (tx) => {
        const [plan, feature] = await Promise.all([
          tx.plan.findUniqueOrThrow({ where: { key: input.planKey } }),
          tx.feature.findUniqueOrThrow({ where: { key: input.featureKey } }),
        ]);
        const entitlement = await tx.planEntitlement.upsert({
          where: {
            planId_featureId: { planId: plan.id, featureId: feature.id },
          },
          create: {
            planId: plan.id,
            featureId: feature.id,
            enabled: input.enabled,
            limit: input.limit,
          },
          update: { enabled: input.enabled, limit: input.limit },
        });
        await tx.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            actorType: "ADMIN",
            action: "PLAN_ENTITLEMENT_UPDATED",
            targetType: "PlanEntitlement",
            targetId: entitlement.id,
            metadata: {
              planKey: input.planKey,
              featureKey: input.featureKey,
              enabled: input.enabled,
              limit: input.limit,
            },
          },
        });
        return entitlement;
      });
    }),

  jobs: adminProcedure.query(({ ctx }) =>
    ctx.db.jobFailure.findMany({
      where: { resolvedAt: null },
      take: 100,
      orderBy: { createdAt: "desc" },
    }),
  ),

  audit: adminProcedure.query(({ ctx }) => {
    requirePermission(ctx.session.user.role, "AUDIT_READ");
    return ctx.db.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    });
  }),
});
