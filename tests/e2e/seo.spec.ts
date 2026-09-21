import { expect, test } from "@playwright/test";

test("serves crawl policy, sitemap, canonical metadata, and mobile-safe content", async ({
  page,
  request,
}) => {
  const [robotsResponse, sitemapResponse] = await Promise.all([
    request.get("/robots.txt"),
    request.get("/sitemap.xml"),
  ]);
  expect(robotsResponse.ok()).toBe(true);
  expect(sitemapResponse.ok()).toBe(true);
  expect(sitemapResponse.headers()["content-type"]).toContain("application/xml");

  const robots = await robotsResponse.text();
  expect(robots).toContain("Disallow: /dashboard");
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Sitemap: http://localhost:3000/sitemap.xml");

  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain("<loc>http://localhost:3000/</loc>");
  expect(sitemap).toContain("<loc>http://localhost:3000/features</loc>");
  expect(sitemap).not.toContain("/dashboard");
  expect(sitemap).not.toContain("/login");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^http:\/\/localhost:3000\/?$/,
  );
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
