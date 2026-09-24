import { Prisma } from "../../../generated/prisma/client";

import { cacheDelete, cacheKeys } from "~/server/cache";
import { db } from "~/server/db";
import { AppError } from "~/server/errors";
import { parsePublicationSnapshot } from "~/server/publishing/snapshot";
import {
  canManageRole,
  hasPermission,
} from "~/server/security/authorization";

export async function disableReportedBlock(input: {
  actorId: string;
  caseId: string;
  reason: string;
}) {
  let result:
    | { action: { id: string }; username: string; blockId: string }
    | undefined;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      result = await db.$transaction(
        async (tx) => {
          const [actor, moderationCase] = await Promise.all([
            tx.user.findUnique({
              where: { id: input.actorId },
              select: { id: true, role: true, status: true },
            }),
            tx.moderationCase.findUnique({
              where: { id: input.caseId },
              include: {
                profile: {
                  select: {
                    id: true,
                    username: true,
                    user: { select: { role: true } },
                  },
                },
                report: {
                  include: {
                    block: {
                      include: {
                        page: {
                          include: {
                            publication: { include: { version: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            }),
          ]);
          if (!actor || actor.status !== "ACTIVE") {
            throw new AppError("UNAUTHORIZED", "Staff account is not active");
          }
          if (!moderationCase) {
            throw new AppError("NOT_FOUND", "Moderation case not found");
          }
          if (
            !hasPermission(actor.role, "PROFILE_MODERATE") ||
            !canManageRole(actor.role, moderationCase.profile.user.role)
          ) {
            throw new AppError("FORBIDDEN", "You cannot moderate this profile");
          }
          const block = moderationCase.report.block;
          if (!block || block.page.profileId !== moderationCase.profileId) {
            throw new AppError(
              "VALIDATION_ERROR",
              "This report is not attached to a valid block",
            );
          }

          await tx.block.update({
            where: { id: block.id },
            data: { enabled: false },
          });

          const publication = block.page.publication;
          if (publication) {
            const snapshot = parsePublicationSnapshot(
              publication.version.snapshot,
            );
            const latest = await tx.pageVersion.findFirst({
              where: { pageId: block.pageId },
              orderBy: { version: "desc" },
              select: { version: true },
            });
            const version = await tx.pageVersion.create({
              data: {
                pageId: block.pageId,
                version: (latest?.version ?? 0) + 1,
                snapshot: {
                  ...snapshot,
                  blocks: snapshot.blocks.filter((item) => item.id !== block.id),
                  generatedAt: new Date().toISOString(),
                } as unknown as Prisma.InputJsonValue,
                createdById: actor.id,
              },
            });
            await tx.pagePublication.update({
              where: { pageId: block.pageId },
              data: { versionId: version.id, publishedAt: new Date() },
            });
          }

          await Promise.all([
            tx.moderationCase.update({
              where: { id: moderationCase.id },
              data: { status: "RESOLVED" },
            }),
            tx.report.update({
              where: { id: moderationCase.reportId },
              data: { status: "RESOLVED" },
            }),
          ]);
          const action = await tx.moderationAction.create({
            data: {
              caseId: moderationCase.id,
              actorId: actor.id,
              type: "DISABLE_BLOCK",
              reason: input.reason,
              metadata: { blockId: block.id, blockType: block.type },
            },
            select: { id: true },
          });
          await tx.auditLog.create({
            data: {
              actorId: actor.id,
              actorType: "ADMIN",
              action: "MODERATION_BLOCK_DISABLED",
              targetType: "Block",
              targetId: block.id,
              metadata: {
                caseId: moderationCase.id,
                profileId: moderationCase.profileId,
                reason: input.reason,
              },
            },
          });
          return {
            action,
            username: moderationCase.profile.username,
            blockId: block.id,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      break;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034") &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }
  if (!result) throw new AppError("CONFLICT", "Please retry moderation");
  await cacheDelete(
    cacheKeys.publicProfile(result.username),
    cacheKeys.publicWidget(result.blockId),
    cacheKeys.publicWidgetStale(result.blockId),
  );
  return result.action;
}
