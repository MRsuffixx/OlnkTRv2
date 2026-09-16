import { describe, expect, it } from "vitest";

import { normalizeThemeConfig } from "~/server/publishing/snapshot";

describe("theme config normalization", () => {
  it("adds presentation defaults to the original version-one shape", () => {
    const theme = normalizeThemeConfig({
      schemaVersion: 1,
      colors: { background: "#ffffff", text: "#111111" },
    });

    expect(theme.layout.alignment).toBe("center");
    expect(theme.layout.maxWidth).toBe(560);
    expect(theme.background.type).toBe("COLOR");
    expect(theme.buttons.shape).toBe("rounded");
  });

  it("rejects arbitrary font identifiers", () => {
    expect(() => normalizeThemeConfig({
      schemaVersion: 1,
      colors: { background: "#ffffff", text: "#111111" },
      typography: { family: "url(https://evil.test/font.woff2)" },
    })).toThrow();
  });
});
