import { describe, expect, it } from "vitest";

import {
  buildRobotsPolicy,
  buildStaticSitemapEntries,
  canonicalUrl,
  isPublishedSnapshotIndexable,
} from "~/server/seo/policy";

describe("SEO policy", () => {
  it("builds canonical URLs from the configured application origin", () => {
    expect(canonicalUrl("/pricing", "https://olnk.tr/")).toBe(
      "https://olnk.tr/pricing",
    );
    expect(canonicalUrl("/", "https://olnk.tr")).toBe("https://olnk.tr/");
  });

  it("advertises only public marketing routes in the static sitemap", () => {
    expect(
      buildStaticSitemapEntries("https://olnk.tr").map((entry) => entry.url),
    ).toEqual([
      "https://olnk.tr/",
      "https://olnk.tr/features",
      "https://olnk.tr/pricing",
      "https://olnk.tr/privacy",
      "https://olnk.tr/terms",
    ]);
  });

  it("indexes only public snapshots that explicitly permit indexing", () => {
    expect(
      isPublishedSnapshotIndexable({
        page: { visibility: "PUBLIC" },
        seo: { robots: "index,follow" },
      }),
    ).toBe(true);
    expect(
      isPublishedSnapshotIndexable({
        page: { visibility: "UNLISTED" },
        seo: { robots: "index,follow" },
      }),
    ).toBe(false);
    expect(
      isPublishedSnapshotIndexable({
        page: { visibility: "PUBLIC" },
        seo: { robots: "noindex,nofollow" },
      }),
    ).toBe(false);
  });

  it("blocks private application surfaces and points crawlers to the sitemap", () => {
    const policy = buildRobotsPolicy("https://olnk.tr");
    expect(policy.sitemap).toBe("https://olnk.tr/sitemap.xml");
    expect(policy.host).toBe("https://olnk.tr");
    expect(policy.rules).toMatchObject({
      userAgent: "*",
      allow: ["/", "/api/assets/"],
      disallow: expect.arrayContaining([
        "/admin",
        "/api",
        "/dashboard",
        "/login",
        "/onboarding",
        "/verify-request",
      ]),
    });
  });
});
