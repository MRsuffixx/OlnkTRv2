import { describe, expect, it } from "vitest";

import {
  addUtcCalendarMonths,
  manualPremiumGrantSchema,
} from "~/server/billing/manual-subscription";

describe("manual subscription month arithmetic", () => {
  it("clamps month-end dates instead of overflowing", () => {
    expect(
      addUtcCalendarMonths(new Date("2026-01-31T12:00:00Z"), 1).toISOString(),
    ).toBe("2026-02-28T12:00:00.000Z");
  });

  it("preserves leap-day calendar semantics", () => {
    expect(
      addUtcCalendarMonths(new Date("2024-01-31T12:00:00Z"), 1).toISOString(),
    ).toBe("2024-02-29T12:00:00.000Z");
  });

  it("rejects grants outside the supported month range", () => {
    expect(() => addUtcCalendarMonths(new Date(), 0)).toThrow(
      "MANUAL_SUBSCRIPTION_MONTHS_INVALID",
    );
    expect(() => addUtcCalendarMonths(new Date(), 25)).toThrow(
      "MANUAL_SUBSCRIPTION_MONTHS_INVALID",
    );
  });
});

describe("manual Premium grant input", () => {
  it("requires an explicit confirmation and a bounded month count", () => {
    const valid = {
      userId: "cm12345678901234567890123",
      months: 3,
      reason: "Paid by bank transfer",
      confirmation: "CONFIRM",
    };

    expect(manualPremiumGrantSchema.safeParse(valid).success).toBe(true);
    expect(
      manualPremiumGrantSchema.safeParse({ ...valid, months: 25 }).success,
    ).toBe(false);
    expect(
      manualPremiumGrantSchema.safeParse({ ...valid, confirmation: "confirm" })
        .success,
    ).toBe(false);
  });
});
