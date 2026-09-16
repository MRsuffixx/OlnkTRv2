import { describe, expect, it } from "vitest";

import { parseSidebarPreference, serializeSidebarPreference } from "~/components/shell/shell-state";

describe("sidebar preference", () => {
  it("ignores stale or malformed storage and round-trips version one", () => {
    expect(parseSidebarPreference(null)).toBe(false);
    expect(parseSidebarPreference("not-json")).toBe(false);
    expect(parseSidebarPreference('{"version":2,"collapsed":true}')).toBe(false);
    expect(parseSidebarPreference(serializeSidebarPreference(true))).toBe(true);
  });
});
