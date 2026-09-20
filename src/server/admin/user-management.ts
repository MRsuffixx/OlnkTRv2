import { z } from "zod";

import type { Prisma } from "../../../generated/prisma/client";

import { cacheDelete, cacheKeys } from "~/server/cache";
import { db } from "~/server/db";
import { AppError } from "~/server/errors";
import {
  canAssignRole,
  canManageRole,
  hasPermission,
  type Role,
} from "~/server/security/authorization";

export const staffActionReasonSchema = z.string().trim().min(3).max(500);

async function staffAndTarget(
  tx: Prisma.TransactionClient,
  actorId: string,
  targetUserId: string,
) {
  const [actor, target] = await Promise.all([
    tx.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true, status: true },
    }),
    tx.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, status: true },
    }),
  ]);
  if (!actor || actor.status !== "ACTIVE") {
    throw new AppError("UNAUTHORIZED", "Staff account is not active");
  }
  if (!target) throw new AppError("NOT_FOUND", "User not found");
  if (actor.id === target.id) {
    throw new AppError("CONFLICT", "You cannot manage your own account");
  }
  return { actor, target };
}

export async function getManagedUserDetail(
  actorId: string,
  targetUserId: string,
) {
  return db.$transaction(async (tx) => {
    const { actor, target } = await staffAndTarget(tx, actorId, targetUserId);
    if (!canManageRole(actor.role, target.role)) {
      throw new AppError("FORBIDDEN", "You cannot inspect this user");
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: target.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        locale: true,
        timezone: true,
        status: true,
        onboardingStatus: true,
        createdAt: true,
        updatedAt: true,
        profiles: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            status: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { customDomains: true, reports: true } },
            page: {
              select: {
                id: true,
                title: true,
                visibility: true,
                updatedAt: true,
                publication: {
                  select: { publishedAt: true, version: { select: { version: true } } },
                },
                _count: { select: { blocks: true } },
              },
            },
          },
        },
        subscriptions: {
          orderBy: { updatedAt: "desc" },
          take: 20,
          select: {
            id: true,
            provider: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            canceledAt: true,
            createdAt: true,
            updatedAt: true,
            plan: { select: { key: true, name: true } },
          },
        },
        sessions: {
          where: { revokedAt: null, expires: { gt: new Date() } },
          orderBy: { lastSeenAt: "desc" },
          take: 20,
          select: {
            id: true,
            createdAt: true,
            lastSeenAt: true,
            expires: true,
            userAgent: true,
          },
        },
        securityEvents: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            type: true,
            severity: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });
    const profileIds = user.profiles.map((profile) => profile.id);
    const [media, analytics, audit] = await Promise.all([
      tx.mediaAsset.aggregate({
        where: { ownerId: user.id, status: { not: "DELETED" } },
        _count: { _all: true },
        _sum: { size: true },
      }),
      tx.profileAnalyticsDaily.aggregate({
        where: { profileId: { in: profileIds } },
        _sum: { views: true, uniqueViews: true, clicks: true },
      }),
      tx.auditLog.findMany({
        where: {
          OR: [
            { targetType: "User", targetId: user.id },
            ...(profileIds.length
              ? [{ targetType: "Profile", targetId: { in: profileIds } }]
              : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          actorId: true,
          actorType: true,
          action: true,
          targetType: true,
          targetId: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    const { profiles, subscriptions, sessions, securityEvents, ...account } =
      user;
    return {
      user: account,
      profiles,
      subscriptions,
      activeSessions: sessions,
      securityEvents,
      audit,
      usage: {
        mediaCount: media._count._all,
        mediaBytes: media._sum.size ?? 0n,
        views: analytics._sum.views ?? 0,
        uniqueViews: analytics._sum.uniqueViews ?? 0,
        clicks: analytics._sum.clicks ?? 0,
      },
      capabilities: {
        canModerate: canManageRole(actor.role, target.role),
        canAssignRole:
          hasPermission(actor.role, "ROLE_MANAGE") &&
          target.role !== "SUPER_ADMIN",
        canGrantPremium: hasPermission(actor.role, "PLAN_MANAGE"),
      },
    };
  });
}

export async function setUserSuspended(input: {
  actorId: string;
  targetUserId: string;
  suspended: boolean;
  reason: string;
}) {
  const reason = staffActionReasonSchema.parse(input.reason);
  const result = await db.$transaction(async (tx) => {
    const { actor, target } = await staffAndTarget(
      tx,
      input.actorId,
      input.targetUserId,
    );
    if (
      !hasPermission(actor.role, "USER_SUSPEND") ||
      !canManageRole(actor.role, target.role)
    ) {
      throw new AppError("FORBIDDEN", "You cannot moderate this user");
    }
    if (!input.suspended && target.status !== "SUSPENDED") {
      throw new AppError("CONFLICT", "Only suspended users can be restored");
    }
    if (
      input.suspended &&
      target.status !== "ACTIVE" &&
      target.status !== "SUSPENDED"
    ) {
      throw new AppError("CONFLICT", "This account state cannot be suspended");
    }

    const status = input.suspended ? "SUSPENDED" : "ACTIVE";
    const user = await tx.user.update({
      where: { id: target.id },
      data: { status },
      include: { profiles: { select: { username: true } } },
    });
    if (input.suspended) {
      await tx.session.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { expires: new Date(0), revokedAt: new Date() },
      });
    }
    await Promise.all([
      tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorType: "ADMIN",
          action: input.suspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
          targetType: "User",
          targetId: target.id,
          metadata: {
            actorRole: actor.role,
            fromStatus: target.status,
            toStatus: status,
            reason,
          },
        },
      }),
      tx.securityEvent.create({
        data: {
          userId: target.id,
          type: input.suspended
            ? "ACCOUNT_SUSPENDED_BY_STAFF"
            : "ACCOUNT_RESTORED_BY_STAFF",
          severity: input.suspended ? "WARNING" : "INFO",
          metadata: { actorId: actor.id, actorRole: actor.role, reason },
        },
      }),
    ]);
    return user;
  });
  await cacheDelete(
    ...result.profiles.map((profile) => cacheKeys.publicProfile(profile.username)),
  );
  return result;
}

export async function setProfileModeration(input: {
  actorId: string;
  profileId: string;
  hidden: boolean;
  reason: string;
}) {
  const reason = staffActionReasonSchema.parse(input.reason);
  const result = await db.$transaction(async (tx) => {
    const profile = await tx.profile.findUnique({
      where: { id: input.profileId },
      select: {
        id: true,
        username: true,
        status: true,
        userId: true,
        user: { select: { role: true } },
      },
    });
    if (!profile) throw new AppError("NOT_FOUND", "Profile not found");
    const { actor, target } = await staffAndTarget(
      tx,
      input.actorId,
      profile.userId,
    );
    if (
      !hasPermission(actor.role, "PROFILE_MODERATE") ||
      !canManageRole(actor.role, target.role)
    ) {
      throw new AppError("FORBIDDEN", "You cannot moderate this profile");
    }
    if (!input.hidden && profile.status !== "MODERATION_HOLD") {
      throw new AppError(
        "CONFLICT",
        "Only profiles under moderation hold can be restored",
      );
    }
    const status = input.hidden ? "MODERATION_HOLD" : "ACTIVE";
    const updated = await tx.profile.update({
      where: { id: profile.id },
      data: { status },
    });
    await Promise.all([
      tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorType: "ADMIN",
          action: input.hidden
            ? "PROFILE_MODERATION_HOLD"
            : "PROFILE_MODERATION_RESTORED",
          targetType: "Profile",
          targetId: profile.id,
          metadata: {
            actorRole: actor.role,
            ownerId: profile.userId,
            previousStatus: profile.status,
            toStatus: status,
            reason,
          },
        },
      }),
      tx.securityEvent.create({
        data: {
          userId: profile.userId,
          type: input.hidden
            ? "PROFILE_HIDDEN_BY_STAFF"
            : "PROFILE_RESTORED_BY_STAFF",
          severity: input.hidden ? "WARNING" : "INFO",
          metadata: {
            actorId: actor.id,
            actorRole: actor.role,
            profileId: profile.id,
            reason,
          },
        },
      }),
    ]);
    return { profile: updated, username: profile.username };
  });
  await cacheDelete(cacheKeys.publicProfile(result.username));
  return result.profile;
}

export async function changeUserRole(input: {
  actorId: string;
  targetUserId: string;
  role: Role;
  reason: string;
}) {
  const reason = staffActionReasonSchema.parse(input.reason);
  return db.$transaction(async (tx) => {
    const { actor, target } = await staffAndTarget(
      tx,
      input.actorId,
      input.targetUserId,
    );
    if (!canAssignRole(actor.role, target.role, input.role)) {
      throw new AppError("FORBIDDEN", "You cannot assign this role");
    }
    const user = await tx.user.update({
      where: { id: target.id },
      data: { role: input.role },
    });
    await Promise.all([
      tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorType: "ADMIN",
          action: "USER_ROLE_CHANGED",
          targetType: "User",
          targetId: target.id,
          metadata: {
            fromRole: target.role,
            toRole: input.role,
            reason,
          },
        },
      }),
      tx.securityEvent.create({
        data: {
          userId: target.id,
          type: "ROLE_CHANGED_BY_ADMIN",
          severity: "INFO",
          metadata: {
            actorId: actor.id,
            fromRole: target.role,
            toRole: input.role,
            reason,
          },
        },
      }),
    ]);
    return user;
  });
}
