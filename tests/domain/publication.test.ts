import { describe, expect, it } from "vitest";
import {
  buildPublicationSnapshot,
  parsePublicationSnapshot,
  publicationContainsAdultLink,
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

  it("derives adult status only from enabled blocks in the publication snapshot", () => {
    const input = {
      profile: {
        username: "creator",
        displayName: "Creator",
        bio: null,
        avatarUrl: null,
      },
      page: {
        title: null,
        description: null,
        visibility: "PUBLIC" as const,
      },
      theme: {
        schemaVersion: 1,
        colors: { background: "#ffffff", text: "#111111" },
      },
      blocks: [
        {
          id: "adult",
          type: "ADULT_LINK",
          enabled: false,
          position: 0,
          config: {
            schemaVersion: 1,
            title: "Adults only",
            url: "https://example.com/adult",
            attestedAdult: true,
          },
        },
      ],
    };

    const withoutAdultLink = buildPublicationSnapshot(input);
    expect(publicationContainsAdultLink(withoutAdultLink)).toBe(false);

    const withAdultLink = buildPublicationSnapshot({
      ...input,
      blocks: input.blocks.map((block) => ({ ...block, enabled: true })),
    });
    expect(publicationContainsAdultLink(withAdultLink)).toBe(true);
  });
});
