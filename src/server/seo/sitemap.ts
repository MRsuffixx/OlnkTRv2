import type { MetadataRoute } from "next";

import { canonicalUrl } from "./policy";

// Google permits up to 50,000 URLs per sitemap, but publication snapshots can
// be large. Smaller shards and query batches keep route memory predictable.
export const PROFILE_SITEMAP_PAGE_SIZE = 1_000;
export const PROFILE_SITEMAP_QUERY_BATCH_SIZE = 100;

export const indexablePublicationWhere = {
  page: {
    visibility: "PUBLIC" as const,
    profile: {
      status: "ACTIVE" as const,
      user: { status: "ACTIVE" as const },
    },
  },
};

export function profileSitemapShardCount(total: number) {
  return Math.ceil(Math.max(0, total) / PROFILE_SITEMAP_PAGE_SIZE);
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildSitemapIndexXml(appUrl: string, profileShards: number) {
  const locations = [
    canonicalUrl("/sitemaps/static.xml", appUrl),
    ...Array.from({ length: profileShards }, (_, index) =>
      canonicalUrl(`/sitemaps/profiles-${index}.xml`, appUrl),
    ),
  ];
  const entries = locations
    .map((location) => `<sitemap><loc>${escapeXml(location)}</loc></sitemap>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export function buildUrlSetXml(entries: MetadataRoute.Sitemap) {
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `<lastmod>${escapeXml(
            entry.lastModified instanceof Date
              ? entry.lastModified.toISOString()
              : entry.lastModified,
          )}</lastmod>`
        : "";
      const changeFrequency = entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : "";
      const priority =
        entry.priority === undefined
          ? ""
          : `<priority>${entry.priority}</priority>`;
      return `<url><loc>${escapeXml(entry.url)}</loc>${lastModified}${changeFrequency}${priority}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function sitemapResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
