import { describe, expect, it } from "vitest";
import { buildPublicationSnapshot } from "~/server/publishing/snapshot";

describe("publication snapshot", () => {
  it("normalizes enabled blocks and excludes draft-only state", () => {
    const snapshot = buildPublicationSnapshot({
      profile: { username: "alice", displayName: "Alice", bio: null, avatarUrl: null },
      page: { title: null, description: null, visibility: "PUBLIC" },
      theme: { schemaVersion: 1, colors: { background: "#ffffff", text: "#111111" } },
      blocks: [
        { id: "b", type: "LINK", enabled: false, position: 1, config: { title: "Hidden", url: "https://hidden.test" } },
        { id: "a", type: "HEADING", enabled: true, position: 0, config: { text: "Hello", level: 1 } },
      ],
    });
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.blocks.map((block) => block.id)).toEqual(["a"]);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });
});
