import { describe, expect, it } from "vitest";

import {
  PROFILE_SITEMAP_QUERY_BATCH_SIZE,
  PROFILE_SITEMAP_PAGE_SIZE,
  buildSitemapIndexXml,
  buildUrlSetXml,
  profileSitemapShardCount,
} from "~/server/seo/sitemap";

describe("sitemap XML", () => {
  it("uses bounded profile shards and small database batches", () => {
    expect(PROFILE_SITEMAP_PAGE_SIZE).toBe(1_000);
    expect(PROFILE_SITEMAP_QUERY_BATCH_SIZE).toBe(100);
    expect(profileSitemapShardCount(0)).toBe(0);
    expect(profileSitemapShardCount(1_000)).toBe(1);
    expect(profileSitemapShardCount(1_001)).toBe(2);
  });

  it("builds a root sitemap index and escapes XML values", () => {
    const xml = buildSitemapIndexXml("https://olnk.tr", 2);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("<loc>https://olnk.tr/sitemaps/static.xml</loc>");
    expect(xml).toContain("<loc>https://olnk.tr/sitemaps/profiles-0.xml</loc>");
    expect(xml).toContain("<loc>https://olnk.tr/sitemaps/profiles-1.xml</loc>");

    expect(
      buildUrlSetXml([{ url: "https://olnk.tr/a&b", priority: 0.7 }]),
    ).toContain("https://olnk.tr/a&amp;b");
  });
});
