import { describe, expect, it } from "vitest";
import { parseBlockConfig } from "~/server/page/block-schemas";

describe("block configuration", () => {
  it("validates a link block", () => {
    expect(parseBlockConfig("LINK", { title: "Docs", url: "https://example.com" })).toEqual({
      schemaVersion: 1,
      title: "Docs",
      url: "https://example.com/",
      variant: "standard",
    });
  });

  it("rejects executable links", () => {
    expect(() => parseBlockConfig("LINK", { title: "Bad", url: "javascript:alert(1)" })).toThrow();
  });

  it("rejects a config for the wrong discriminator", () => {
    expect(() => parseBlockConfig("DIVIDER", { title: "not allowed" })).toThrow();
  });
});
