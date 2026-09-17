import { describe, expect, it } from "vitest";

import { envBoolean } from "~/lib/env-values";

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
