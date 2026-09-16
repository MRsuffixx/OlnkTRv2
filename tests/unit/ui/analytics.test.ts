import { describe, expect, it } from "vitest";

import { fillAnalyticsSeries } from "~/lib/analytics";

describe("fillAnalyticsSeries", () => {
  it("fills missing UTC days with zeroes", () => {
    expect(fillAnalyticsSeries([], 3, new Date("2026-09-16T12:00:00Z"))).toEqual([
      { date: "2026-09-14", views: 0, uniqueViews: 0, clicks: 0 },
      { date: "2026-09-15", views: 0, uniqueViews: 0, clicks: 0 },
      { date: "2026-09-16", views: 0, uniqueViews: 0, clicks: 0 },
    ]);
  });

  it("merges duplicate profile rows for the same date", () => {
    const date = new Date("2026-09-16T00:00:00Z");
    expect(fillAnalyticsSeries([
      { date, views: 4, uniqueViews: 3, clicks: 1 },
      { date, views: 5, uniqueViews: 4, clicks: 2 },
    ], 1, date)).toEqual([
      { date: "2026-09-16", views: 9, uniqueViews: 7, clicks: 3 },
    ]);
  });
});
