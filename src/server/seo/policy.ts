import type { MetadataRoute } from "next";

const INDEXABLE_MARKETING_PATHS = [
  "/",
  "/features",
  "/pricing",
  "/privacy",
  "/terms",
] as const;

const PRIVATE_PATHS = [
  "/admin",
  "/api",
  "/dashboard",
  "/login",
  "/onboarding",
  "/verify-request",
] as const;

export function canonicalUrl(path: string, appUrl: string) {
  const base = new URL(appUrl);
  base.pathname = "/";
  base.search = "";
  base.hash = "";
  return new URL(path.replace(/^\/+/, ""), base).toString();
}

export function buildStaticSitemapEntries(
  appUrl: string,
): MetadataRoute.Sitemap {
  return INDEXABLE_MARKETING_PATHS.map((path) => ({
    url: canonicalUrl(path, appUrl),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/features" || path === "/pricing" ? 0.8 : 0.3,
  }));
}

export function isPublishedSnapshotIndexable(snapshot: {
  page: { visibility: "PUBLIC" | "UNLISTED" | "PRIVATE" };
  seo?: { robots?: "index,follow" | "noindex,nofollow" };
}) {
  return (
    snapshot.page.visibility === "PUBLIC" &&
    snapshot.seo?.robots !== "noindex,nofollow"
  );
}

export function buildRobotsPolicy(appUrl: string): MetadataRoute.Robots {
  const origin = new URL(appUrl).origin;
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/assets/"],
      disallow: [...PRIVATE_PATHS],
    },
    sitemap: canonicalUrl("/sitemap.xml", appUrl),
    host: origin,
  };
}
