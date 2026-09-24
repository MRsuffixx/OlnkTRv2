import { expect, test } from "@playwright/test";

test("serves crawl policy, sitemap, canonical metadata, and mobile-safe content", async ({
  page,
  request,
  baseURL,
}) => {
  const origin = new URL(baseURL ?? "http://localhost:3000").origin;
  const [robotsResponse, sitemapResponse] = await Promise.all([
    request.get("/robots.txt"),
    request.get("/sitemap.xml"),
  ]);
  expect(robotsResponse.ok()).toBe(true);
  expect(sitemapResponse.ok()).toBe(true);
  expect(sitemapResponse.headers()["content-type"]).toContain("application/xml");

  const robots = await robotsResponse.text();
  expect(robots).toContain("Disallow: /dashboard$");
  expect(robots).toContain("Disallow: /dashboard/");
  expect(robots).toContain("Disallow: /admin$");
  expect(robots).toContain("Allow: /api/assets/");
  expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);

  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain("<sitemapindex");
  expect(sitemap).toContain(
    `<loc>${origin}/sitemaps/static.xml</loc>`,
  );
  expect(sitemap).not.toContain("/dashboard");
  expect(sitemap).not.toContain("/login");

  const staticSitemap = await request.get("/sitemaps/static.xml");
  expect(staticSitemap.ok()).toBe(true);
  const staticXml = await staticSitemap.text();
  expect(staticXml).toContain(`<loc>${origin}/</loc>`);
  expect(staticXml).toContain(`<loc>${origin}/features</loc>`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  expect(new URL(canonical ?? "", origin).toString()).toBe(`${origin}/`);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /customizable page/i,
  );
  await expect(page.locator("h1")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.goto("/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow, noarchive",
  );
});
