import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildPublicationSnapshot } from "~/server/publishing/snapshot";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: { pagePublication: { count: mocks.count, findMany: mocks.findMany } },
}));

function snapshot(input: {
  username: string;
  visibility?: "PUBLIC" | "UNLISTED";
  robots?: "index,follow" | "noindex,nofollow";
}) {
  return buildPublicationSnapshot({
    profile: {
      username: input.username,
      displayName: input.username,
      bio: null,
      avatarUrl: null,
    },
    page: {
      title: null,
      description: null,
      visibility: input.visibility ?? "PUBLIC",
    },
    seo: { schemaVersion: 1, robots: input.robots ?? "index,follow" },
    theme: {
      schemaVersion: 1,
      colors: { background: "#ffffff", text: "#111111" },
    },
    blocks: [],
  });
}

describe("Next.js SEO routes", () => {
  beforeEach(() => {
    mocks.count.mockReset();
    mocks.findMany.mockReset();
  });

  it("emits public published profiles and excludes noindex snapshots", async () => {
    mocks.count.mockResolvedValue(2);
    mocks.findMany.mockResolvedValue([
      {
        publishedAt: new Date("2026-09-20T12:00:00.000Z"),
        page: { profile: { username: "alice" } },
        version: { snapshot: snapshot({ username: "alice" }) },
      },
      {
        publishedAt: new Date("2026-09-20T13:00:00.000Z"),
        page: { profile: { username: "private-alice" } },
        version: {
          snapshot: snapshot({
            username: "private-alice",
            robots: "noindex,nofollow",
          }),
        },
      },
    ]);
    const { GET } = await import("~/app/sitemaps/[shard]/route");

    const response = await GET(new Request("http://localhost/sitemaps/profiles-0.xml"), {
      params: Promise.resolve({ shard: "profiles-0.xml" }),
    });
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(mocks.count).toHaveBeenCalledOnce();
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 100 }),
    );
    expect(xml).toContain("<loc>http://localhost:3000/alice</loc>");
    expect(xml).toContain("<lastmod>2026-09-20T12:00:00.000Z</lastmod>");
    expect(xml).not.toContain("private-alice");
  });

  it("rejects non-canonical and out-of-range profile shards before querying", async () => {
    mocks.count.mockResolvedValue(1_001);
    const { GET } = await import("~/app/sitemaps/[shard]/route");

    for (const shard of [
      "profiles-01.xml",
      "profiles-2.xml",
      "profiles-999999999.xml",
    ]) {
      const response = await GET(
        new Request(`http://localhost/sitemaps/${shard}`),
        { params: Promise.resolve({ shard }) },
      );
      expect(response.status).toBe(404);
    }

    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("serves a root sitemap index and crawler policy", async () => {
    mocks.count.mockResolvedValue(1_001);
    const { GET } = await import("~/app/sitemap.xml/route");
    const { default: robots } = await import("~/app/robots");
    const index = await GET();
    const xml = await index.text();

    expect(mocks.count).toHaveBeenCalledOnce();
    expect(xml).toContain("<loc>http://localhost:3000/sitemaps/static.xml</loc>");
    expect(xml).toContain("<loc>http://localhost:3000/sitemaps/profiles-0.xml</loc>");
    expect(xml).toContain("<loc>http://localhost:3000/sitemaps/profiles-1.xml</loc>");
    expect(robots()).toMatchObject({
      sitemap: "http://localhost:3000/sitemap.xml",
      host: "http://localhost:3000",
    });
  });
});
