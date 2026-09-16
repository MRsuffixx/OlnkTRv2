import { describe, expect, it } from "vitest";

import { pageDraftUpdateSchema } from "~/server/publishing/snapshot";

describe("page draft update input", () => {
  it("normalizes original theme values while validating page metadata", () => {
    const parsed = pageDraftUpdateSchema.parse({
      pageId: "cm12345678901234567890123",
      title: "  My page  ",
      description: null,
      visibility: "PUBLIC",
      theme: { schemaVersion: 1, colors: { background: "#ffffff", text: "#111111" } },
      seo: { schemaVersion: 1, robots: "index,follow" },
    });

    expect(parsed.title).toBe("My page");
    expect(parsed.theme.layout.blockGap).toBe(12);
  });
});
