import { env } from "~/env";
import { db } from "~/server/db";
import {
  buildSitemapIndexXml,
  indexablePublicationWhere,
  profileSitemapShardCount,
  sitemapResponse,
} from "~/server/seo/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const total = await db.pagePublication.count({
    where: indexablePublicationWhere,
  });
  return sitemapResponse(
    buildSitemapIndexXml(env.APP_URL, profileSitemapShardCount(total)),
  );
}
