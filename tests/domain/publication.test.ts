import { describe, expect, it } from "vitest";
import {
  buildPublicationSnapshot,
  parsePublicationSnapshot,
} from "~/server/publishing/snapshot";

describe("publication snapshot", () => {
  it("normalizes enabled blocks and excludes draft-only state", () => {
    const snapshot = buildPublicationSnapshot({
      profile: { username: "alice", displayName: "Alice", bio: null, avatarUrl: null },
      page: { title: null, description: null, visibility: "PUBLIC" },
      seo: {
        schemaVersion: 1,
        title: "Alice's links",
        robots: "noindex,nofollow",
      },
      theme: { schemaVersion: 1, colors: { background: "#ffffff", text: "#111111" } },
      blocks: [
        { id: "b", type: "LINK", enabled: false, position: 1, config: { title: "Hidden", url: "https://hidden.test" } },
        { id: "a", type: "HEADING", enabled: true, position: 0, config: { text: "Hello", level: 1 } },
      ],
    });
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.blocks.map((block) => block.id)).toEqual(["a"]);
    expect(snapshot.seo).toMatchObject({
      title: "Alice's links",
      robots: "noindex,nofollow",
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("keeps legacy published snapshots indexable when they predate stored SEO config", () => {
    const legacy = buildPublicationSnapshot({
      profile: { username: "legacy", displayName: "Legacy", bio: null, avatarUrl: null },
      page: { title: null, description: null, visibility: "PUBLIC" },
      theme: { schemaVersion: 1, colors: { background: "#ffffff", text: "#111111" } },
      blocks: [],
    });
    const withoutSeo = Object.fromEntries(
      Object.entries(legacy).filter(([key]) => key !== "seo"),
    );

    expect(parsePublicationSnapshot(withoutSeo).seo).toEqual({
      schemaVersion: 1,
      robots: "index,follow",
    });
  });
});
