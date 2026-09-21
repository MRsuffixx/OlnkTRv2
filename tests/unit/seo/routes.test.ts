import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildPublicationSnapshot } from "~/server/publishing/snapshot";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: { pagePublication: { findMany: mocks.findMany } },
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
  beforeEach(() => mocks.findMany.mockReset());

  it("emits public published profiles and excludes noindex snapshots", async () => {
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
    const { default: sitemap } = await import("~/app/sitemap");

    const entries = await sitemap();

    expect(entries).toContainEqual(
      expect.objectContaining({
        url: "http://localhost:3000/alice",
        lastModified: new Date("2026-09-20T12:00:00.000Z"),
      }),
    );
    expect(entries.some((entry) => entry.url.endsWith("/private-alice"))).toBe(
      false,
    );
  });

  it("serves a crawler policy with the sitemap location", async () => {
    const { default: robots } = await import("~/app/robots");
    expect(robots()).toMatchObject({
      sitemap: "http://localhost:3000/sitemap.xml",
      host: "http://localhost:3000",
    });
  });
});
