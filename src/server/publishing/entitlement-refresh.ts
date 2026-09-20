import { Prisma } from "../../../generated/prisma/client";

import { cacheDelete, cacheKeys } from "~/server/cache";
import { db } from "~/server/db";
import { getUserEntitlements } from "~/server/entitlements/service";
import { buildPublicationSnapshot } from "./snapshot";
import {
  effectiveBlocks,
  effectiveTheme,
} from "./effective-publication";
import { migrateThemeConfig } from "./theme-v2";

export async function refreshPublicationEntitlements(userId: string) {
  const [{ grants }, pages] = await Promise.all([
    getUserEntitlements(userId),
    db.page.findMany({
      where: {
        profile: { userId },
        publication: { isNot: null },
      },
      include: {
        profile: { include: { avatarAsset: true } },
        draft: true,
        blocks: { where: { deletedAt: null } },
      },
    }),
  ]);

  for (const page of pages) {
    if (!page.draft) continue;
    const snapshot = buildPublicationSnapshot({
      profile: {
        username: page.profile.username,
        displayName: page.profile.displayName,
        bio: page.profile.bio,
        avatarUrl: page.profile.avatarAsset?.id ?? null,
        verified: page.profile.verified,
      },
      page: {
        title: page.title,
        description: page.description,
        visibility: page.visibility,
      },
      theme: effectiveTheme(
        migrateThemeConfig(page.draft.themeConfig),
        grants,
      ),
      blocks: effectiveBlocks(page.blocks, grants),
    });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await db.$transaction(
          async (tx) => {
            const latest = await tx.pageVersion.findFirst({
              where: { pageId: page.id },
              orderBy: { version: "desc" },
              select: { version: true },
            });
            const created = await tx.pageVersion.create({
              data: {
                pageId: page.id,
                version: (latest?.version ?? 0) + 1,
                snapshot: snapshot as unknown as Prisma.InputJsonValue,
              },
            });
            await tx.pagePublication.update({
              where: { pageId: page.id },
              data: { versionId: created.id, publishedAt: new Date() },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        break;
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2002" || error.code === "P2034");
        if (!retryable || attempt === 2) throw error;
      }
    }
    await cacheDelete(
      cacheKeys.publicProfile(page.profile.username),
      ...page.blocks.flatMap((block) => [cacheKeys.publicWidget(block.id), cacheKeys.publicWidgetStale(block.id)]),
    );
  }
  return { refreshed: pages.length };
}
