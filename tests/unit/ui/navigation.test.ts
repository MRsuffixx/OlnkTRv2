import { describe, expect, it } from "vitest";

import { dashboardNavigation, isNavigationItemActive } from "~/lib/navigation";

describe("dashboardNavigation", () => {
  it("matches nested settings routes without activating the dashboard root", () => {
    expect(isNavigationItemActive("/dashboard/settings/security", "/dashboard/settings")).toBe(true);
    expect(isNavigationItemActive("/dashboard/analytics", "/dashboard")).toBe(false);
    expect(dashboardNavigation.flatMap((group) => group.items)).toHaveLength(7);
  });
});
