import { describe, expect, it } from "vitest";

import { envBoolean, googleSiteVerification } from "~/lib/env-values";

describe("envBoolean", () => {
  it("parses explicit true and false strings", () => {
    expect(envBoolean.parse("true")).toBe(true);
    expect(envBoolean.parse("false")).toBe(false);
  });

  it("accepts native booleans and rejects ambiguous values", () => {
    expect(envBoolean.parse(true)).toBe(true);
    expect(envBoolean.parse(false)).toBe(false);
    expect(() => envBoolean.parse("yes")).toThrow();
  });
});

describe("googleSiteVerification", () => {
  it("accepts a token, treats blank as disabled, and rejects short values", () => {
    expect(googleSiteVerification.parse("  verification-token  ")).toBe(
      "verification-token",
    );
    expect(googleSiteVerification.parse("")).toBeUndefined();
    expect(() => googleSiteVerification.parse("short")).toThrow();
  });
});
