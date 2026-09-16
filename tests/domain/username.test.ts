import { describe, expect, it } from "vitest";
import { normalizeUsername, usernameSchema } from "~/server/profile/username";

describe("username policy", () => {
  it("normalizes case and surrounding whitespace", () => {
    expect(normalizeUsername("  Alice_42  ")).toBe("alice_42");
  });

  it.each(["admin", "API", "tr", "dashboard"])("rejects reserved username %s", (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });

  it.each(["ab", "bad space", "-starts", "ends-", "ümlaut"])("rejects unsafe username %s", (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });

  it("accepts safe normalized usernames", () => {
    expect(usernameSchema.parse("alice_42")).toBe("alice_42");
  });
});
