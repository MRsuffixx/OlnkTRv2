import type { MetadataRoute } from "next";

import { env } from "~/env";
import { db } from "~/server/db";
import { logger } from "~/server/observability/logger";
import { parsePublicationSnapshot } from "~/server/publishing/snapshot";
import {
  buildStaticSitemapEntries,
  canonicalUrl,
  isPublishedSnapshotIndexable,
} from "~/server/seo/policy";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publications = await db.pagePublication.findMany({
    where: {
      page: {
        visibility: "PUBLIC",
        profile: {
          status: "ACTIVE",
          user: { status: "ACTIVE" },
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    select: {
      publishedAt: true,
      version: { select: { snapshot: true } },
      page: { select: { profile: { select: { username: true } } } },
    },
  });

  const profiles: MetadataRoute.Sitemap = [];
  for (const publication of publications) {
    try {
      const snapshot = parsePublicationSnapshot(publication.version.snapshot);
      if (!isPublishedSnapshotIndexable(snapshot)) continue;
      profiles.push({
        url: canonicalUrl(`/${publication.page.profile.username}`, env.APP_URL),
        lastModified: publication.publishedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    } catch (error) {
      logger.warn(
        {
          operation: "seo.sitemap.parse-publication",
          username: publication.page.profile.username,
          error,
        },
        "invalid publication excluded from sitemap",
      );
    }
  }

  return [...buildStaticSitemapEntries(env.APP_URL), ...profiles];
}
