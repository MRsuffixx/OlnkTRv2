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
import {
  PROFILE_SITEMAP_PAGE_SIZE,
  PROFILE_SITEMAP_QUERY_BATCH_SIZE,
  buildUrlSetXml,
  indexablePublicationWhere,
  profileSitemapShardCount,
  sitemapResponse,
} from "~/server/seo/sitemap";

export const dynamic = "force-dynamic";

function profileShard(value: string) {
  const match = /^profiles-(0|[1-9]\d*)\.xml$/.exec(value);
  if (!match?.[1]) return null;
  const shard = Number(match[1]);
  return Number.isSafeInteger(shard) ? shard : null;
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/sitemaps/[shard]">,
) {
  const { shard } = await params;
  if (shard === "static.xml") {
    return sitemapResponse(buildUrlSetXml(buildStaticSitemapEntries(env.APP_URL)));
  }

  const shardNumber = profileShard(shard);
  if (shardNumber === null) {
    return new Response("Not found", { status: 404 });
  }

  const total = await db.pagePublication.count({
    where: indexablePublicationWhere,
  });
  if (shardNumber >= profileSitemapShardCount(total)) {
    return new Response("Not found", { status: 404 });
  }

  const entries: MetadataRoute.Sitemap = [];
  const shardOffset = shardNumber * PROFILE_SITEMAP_PAGE_SIZE;
  let fetched = 0;

  while (fetched < PROFILE_SITEMAP_PAGE_SIZE) {
    const publications = await db.pagePublication.findMany({
      where: indexablePublicationWhere,
      orderBy: [{ publishedAt: "desc" }, { pageId: "asc" }],
      skip: shardOffset + fetched,
      take: Math.min(
        PROFILE_SITEMAP_QUERY_BATCH_SIZE,
        PROFILE_SITEMAP_PAGE_SIZE - fetched,
      ),
      select: {
        publishedAt: true,
        version: { select: { snapshot: true } },
        page: {
          select: {
            visibility: true,
            profile: { select: { username: true } },
          },
        },
      },
    });

    for (const publication of publications) {
      try {
        const snapshot = parsePublicationSnapshot(
          publication.version.snapshot,
        );
        if (
          !isPublishedSnapshotIndexable(snapshot, publication.page.visibility)
        ) {
          continue;
        }
        entries.push({
          url: canonicalUrl(
            `/${publication.page.profile.username}`,
            env.APP_URL,
          ),
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

    fetched += publications.length;
    if (publications.length < PROFILE_SITEMAP_QUERY_BATCH_SIZE) break;
  }

  return sitemapResponse(buildUrlSetXml(entries));
}
