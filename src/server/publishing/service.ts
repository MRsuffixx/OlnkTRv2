import { Prisma } from "../../../generated/prisma/client";

import { cacheDelete, cacheKeys } from "~/server/cache";
import { db } from "~/server/db";
import { getUserEntitlements } from "~/server/entitlements/service";
import { AppError } from "~/server/errors";
import { buildPublicationSnapshot } from "./snapshot";
import { missingThemeFeatures } from "./theme-entitlements";
import { migrateThemeConfig } from "./theme-v2";

export async function publishPage(userId: string, pageId: string) {
  const page = await db.page.findFirst({
    where: { id: pageId, profile: { userId } },
    include: {
      profile: { include: { avatarAsset: true } },
      draft: true,
      blocks: true,
    },
  });
  if (!page?.draft) throw new AppError("NOT_FOUND", "Page draft not found");

  const theme = migrateThemeConfig(page.draft.themeConfig);
  const { grants } = await getUserEntitlements(userId);
  const missingFeatures = missingThemeFeatures(theme, grants);
  if (missingFeatures.length) {
    throw new AppError(
      "FEATURE_NOT_AVAILABLE",
      `Unavailable features: ${missingFeatures.join(", ")}`,
      { features: missingFeatures },
    );
  }

  const themeAssetIds = [
    theme.layout.coverAssetId,
    theme.background.type === "IMAGE" || theme.background.type === "VIDEO"
      ? theme.background.assetId
      : undefined,
    theme.background.type === "VIDEO"
      ? theme.background.posterAssetId
      : undefined,
  ].filter((id): id is string => Boolean(id));

  if (themeAssetIds.length) {
    const assets = await db.mediaAsset.findMany({
      where: { id: { in: themeAssetIds }, ownerId: userId, status: "READY" },
      select: { id: true },
    });
    if (
      new Set(assets.map((asset) => asset.id)).size !==
      new Set(themeAssetIds).size
    ) {
      throw new AppError("VALIDATION_ERROR", "Theme media is unavailable");
    }
  }

  const snapshot = buildPublicationSnapshot({
    profile: {
      username: page.profile.username,
      displayName: page.profile.displayName,
      bio: page.profile.bio,
      avatarUrl: page.profile.avatarAsset?.id ?? null,
    },
    page: {
      title: page.title,
      description: page.description,
      visibility: page.visibility,
    },
    theme,
    blocks: page.blocks,
  });
  const publicAssetIds = page.blocks
    .filter(
      (block) =>
        block.enabled &&
        block.type === "IMAGE" &&
        block.config &&
        typeof block.config === "object" &&
        "assetId" in block.config,
    )
    .map((block) => (block.config as { assetId: string }).assetId);
  publicAssetIds.push(...themeAssetIds);
  if (page.profile.avatarAsset?.id) {
    publicAssetIds.push(page.profile.avatarAsset.id);
  }

  let version;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      version = await db.$transaction(
        async (tx) => {
          const latest = await tx.pageVersion.findFirst({
            where: { pageId },
            orderBy: { version: "desc" },
            select: { version: true },
          });
          const created = await tx.pageVersion.create({
            data: {
              pageId,
              version: (latest?.version ?? 0) + 1,
              snapshot: snapshot as unknown as Prisma.InputJsonValue,
              createdById: userId,
            },
          });
          await tx.pagePublication.upsert({
            where: { pageId },
            create: { pageId, versionId: created.id },
            update: { versionId: created.id, publishedAt: new Date() },
          });
          if (publicAssetIds.length) {
            await tx.mediaAsset.updateMany({
              where: {
                id: { in: publicAssetIds },
                ownerId: userId,
                status: "READY",
              },
              data: { private: false },
            });
          }
          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      break;
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002" ||
        attempt === 2
      ) {
        throw error;
      }
    }
  }
  await cacheDelete(cacheKeys.publicProfile(page.profile.username));
  return version;
}

export async function getPublicSnapshot(username: string) {
  return db.pagePublication.findFirst({
    where: {
      page: {
        profile: {
          username,
          status: "ACTIVE",
          user: { status: "ACTIVE" },
        },
        visibility: { not: "PRIVATE" },
      },
    },
    select: {
      version: { select: { snapshot: true } },
      page: { select: { profile: { select: { id: true } } } },
    },
  });
}
