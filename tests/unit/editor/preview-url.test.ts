import { describe, expect, it } from "vitest";

import { safePreviewHref } from "~/features/editor/preview-url";

describe("safePreviewHref", () => {
  it("allows supported external schemes", () => {
    expect(safePreviewHref("https://example.com")).toBe("https://example.com/");
    expect(safePreviewHref("mailto:hello@example.com")).toBe("mailto:hello@example.com");
  });

  it("never exposes an unsafe draft scheme to the preview", () => {
    expect(safePreviewHref("javascript:alert(1)")).toBe("#");
    expect(safePreviewHref("data:text/html,hello")).toBe("#");
  });
});
