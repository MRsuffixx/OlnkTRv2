import { describe, expect, it } from "vitest";

import { normalizeHostname } from "~/server/domains/hostname";

describe("normalizeHostname", () => {
  it("normalizes case and a trailing dot", () => expect(normalizeHostname("Profile.Example.COM.")).toBe("profile.example.com"));
  it.each(["localhost", "127.0.0.1", "https://example.com", "example", "-bad.example.com", "bad..example.com"])("rejects unsafe hostname %s", (value) => {
    expect(() => normalizeHostname(value)).toThrow();
  });
});
