import { createHash } from "node:crypto";
import { z } from "zod";

import { env } from "~/env";
import { cacheDelete, cacheKeys } from "~/server/cache";
import { AppError } from "~/server/errors";
import {
  MODERATION_REPORT_REASONS,
  moderationReasonPriority,
} from "~/server/moderation/policy";
import { disableReportedBlock } from "~/server/moderation/service";
import { parseBlockConfig } from "~/server/page/block-schemas";
import {
  canManageRole,
  hasPermission,
  roles,
} from "~/server/security/authorization";
import { rateLimit } from "~/server/security/rate-limit";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";

function safeBlockConfig(type: string, config: unknown) {
  try {
    return parseBlockConfig(type, config);
  } catch {
    return null;
  }
}

export const moderationRouter = createTRPCRouter({
  report: publicProcedure
    .input(
      z.object({
        profileId: z.string().cuid(),
        blockId: z.string().cuid().optional(),
        reason: z.enum(MODERATION_REPORT_REASONS),
        details: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ip =
        ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";
      if (!(await rateLimit("report", ip, 5, 3600)).allowed) {
        throw new AppError("RATE_LIMITED", "Too many reports");
      }
      if (
        !(await ctx.db.profile.findFirst({
          where: { id: input.profileId, status: "ACTIVE" },
          select: { id: true },
        }))
      ) {
        throw new AppError("NOT_FOUND", "Profile not found");
      }
      if (
        input.blockId &&
        !(await ctx.db.block.findFirst({
          where: {
            id: input.blockId,
            page: { profileId: input.profileId },
            deletedAt: null,
          },
        }))
      ) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Block does not belong to profile",
        );
      }
      return ctx.db.report.create({
        data: {
          ...input,
          priority: moderationReasonPriority(input.reason),
          reporterHash: createHash("sha256")
            .update(`${env.ANALYTICS_SALT}:report:${ip}`)
            .digest("hex"),
        },
        select: { id: true, status: true },
      });
    }),

  cases: protectedProcedure.query(async ({ ctx }) => {
    if (!hasPermission(ctx.session.user.role, "REPORT_REVIEW")) {
      throw new AppError("FORBIDDEN", "Permission denied");
    }
    const manageableRoles = roles.filter((role) =>
      canManageRole(ctx.session.user.role, role),
    );
    const cases = await ctx.db.moderationCase.findMany({
      where: { profile: { user: { role: { in: manageableRoles } } } },
      take: 100,
      orderBy: [{ report: { priority: "desc" } }, { createdAt: "desc" }],
      include: {
        report: {
          include: {
            block: {
              select: { id: true, type: true, config: true, enabled: true },
            },
          },
        },
        profile: true,
        actions: true,
      },
    });
    return cases.map((item) => ({
      ...item,
      report: {
        ...item.report,
        block: item.report.block
          ? {
              ...item.report.block,
              config: safeBlockConfig(
                item.report.block.type,
                item.report.block.config,
              ),
            }
          : null,
      },
    }));
  }),

  queue: protectedProcedure.query(async ({ ctx }) => {
    if (!hasPermission(ctx.session.user.role, "REPORT_REVIEW")) {
      throw new AppError("FORBIDDEN", "Permission denied");
    }
    const manageableRoles = roles.filter((role) =>
      canManageRole(ctx.session.user.role, role),
    );
    const reports = await ctx.db.report.findMany({
      where: {
        status: { in: ["OPEN", "REVIEWING"] },
        profile: { user: { role: { in: manageableRoles } } },
      },
      take: 100,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        block: {
          select: { id: true, type: true, config: true, enabled: true },
        },
        profile: {
          select: {
            id: true,
            username: true,
            displayName: true,
            status: true,
          },
        },
        moderationCase: { select: { id: true, status: true } },
      },
    });
    return reports.map((report) => ({
      ...report,
      block: report.block
        ? {
            ...report.block,
            config: safeBlockConfig(report.block.type, report.block.config),
          }
        : null,
    }));
  }),

  openCase: protectedProcedure
    .input(z.object({ reportId: z.string().cuid() }))
    .mutation(({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, "REPORT_REVIEW")) {
        throw new AppError("FORBIDDEN", "Permission denied");
      }
      return ctx.db.$transaction(async (tx) => {
        const report = await tx.report.findUnique({
          where: { id: input.reportId },
          include: {
            profile: { select: { user: { select: { role: true } } } },
          },
        });
        if (!report) throw new AppError("NOT_FOUND", "Report not found");
        if (!canManageRole(ctx.session.user.role, report.profile.user.role)) {
          throw new AppError("FORBIDDEN", "You cannot review this report");
        }
        const item = await tx.moderationCase.upsert({
          where: { reportId: report.id },
          create: {
            reportId: report.id,
            profileId: report.profileId,
            assignedToId: ctx.session.user.id,
            status: "REVIEWING",
          },
          update: {
            assignedToId: ctx.session.user.id,
            status: "REVIEWING",
          },
        });
        await tx.report.update({
          where: { id: report.id },
          data: { status: "REVIEWING" },
        });
        await tx.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            actorType: "ADMIN",
            action: "MODERATION_CASE_OPENED",
            targetType: "ModerationCase",
            targetId: item.id,
          },
        });
        return item;
      });
    }),

  act: protectedProcedure
    .input(
      z.object({
        caseId: z.string().cuid(),
        type: z.enum([
          "HIDE_PROFILE",
          "RESTORE_PROFILE",
          "DISABLE_BLOCK",
          "RESOLVE",
          "DISMISS",
        ]),
        reason: z.string().trim().min(3).max(500),
        confirmation: z.literal("CONFIRM"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, "PROFILE_MODERATE")) {
        throw new AppError("FORBIDDEN", "Permission denied");
      }
      if (input.type === "DISABLE_BLOCK") {
        return disableReportedBlock({
          actorId: ctx.session.user.id,
          caseId: input.caseId,
          reason: input.reason,
        });
      }
      const result = await ctx.db.$transaction(async (tx) => {
        const item = await tx.moderationCase.findUnique({
          where: { id: input.caseId },
          include: {
            profile: {
              select: { username: true, user: { select: { role: true } } },
            },
          },
        });
        if (!item) {
          throw new AppError("NOT_FOUND", "Moderation case not found");
        }
        if (!canManageRole(ctx.session.user.role, item.profile.user.role)) {
          throw new AppError("FORBIDDEN", "You cannot moderate this profile");
        }
        if (input.type === "HIDE_PROFILE" || input.type === "RESTORE_PROFILE") {
          await tx.profile.update({
            where: { id: item.profileId },
            data: {
              status:
                input.type === "HIDE_PROFILE" ? "MODERATION_HOLD" : "ACTIVE",
            },
          });
        }
        const status =
          input.type === "DISMISS"
            ? "DISMISSED"
            : input.type === "RESOLVE"
              ? "RESOLVED"
              : item.status;
        await Promise.all([
          tx.moderationCase.update({
            where: { id: item.id },
            data: { status },
          }),
          tx.report.update({
            where: { id: item.reportId },
            data: { status },
          }),
        ]);
        const action = await tx.moderationAction.create({
          data: {
            caseId: item.id,
            actorId: ctx.session.user.id,
            type: input.type,
            reason: input.reason,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: ctx.session.user.id,
            actorType: "ADMIN",
            action: `MODERATION_${input.type}`,
            targetType: "Profile",
            targetId: item.profileId,
            metadata: { reason: input.reason },
          },
        });
        return { action, username: item.profile.username };
      });
      if (input.type === "HIDE_PROFILE" || input.type === "RESTORE_PROFILE") {
        await cacheDelete(cacheKeys.publicProfile(result.username));
      }
      return result.action;
    }),
});
