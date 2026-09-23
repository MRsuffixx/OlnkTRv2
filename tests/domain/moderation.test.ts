import { describe, expect, it } from "vitest";

import {
  MODERATION_REPORT_REASONS,
  moderationReasonPriority,
} from "~/server/moderation/policy";

describe("moderation policy", () => {
  it("accepts adult-content safety report reasons", () => {
    expect(MODERATION_REPORT_REASONS).toEqual(
      expect.arrayContaining([
        "ADULT_CONTENT",
        "EXPLOITATION",
        "MINOR_SAFETY",
      ]),
    );
  });

  it("prioritizes urgent exploitation and minor-safety reports", () => {
    expect(moderationReasonPriority("MINOR_SAFETY")).toBeGreaterThan(
      moderationReasonPriority("EXPLOITATION"),
    );
    expect(moderationReasonPriority("EXPLOITATION")).toBeGreaterThan(
      moderationReasonPriority("ADULT_CONTENT"),
    );
    expect(moderationReasonPriority("ADULT_CONTENT")).toBeGreaterThan(
      moderationReasonPriority("OTHER"),
    );
  });
});
