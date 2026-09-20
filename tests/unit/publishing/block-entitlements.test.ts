import { describe, expect, it } from "vitest";

import {
  missingBlockFeatures,
  requiredBlockFeatures,
} from "~/server/publishing/block-entitlements";

describe("published block entitlements", () => {
  it("keeps useful interactive blocks available on Free", () => {
    expect(
      requiredBlockFeatures([
        { type: "HIGHLIGHT", enabled: true },
        { type: "COUNTDOWN", enabled: true },
        { type: "POLL", enabled: true },
      ]),
    ).toEqual([]);
  });

  it("requires LIVE_INTEGRATIONS for enabled external live blocks", () => {
    expect(
      requiredBlockFeatures([
        { type: "GITHUB", enabled: true },
        { type: "TWITCH", enabled: true },
        { type: "SPOTIFY", enabled: false },
      ]),
    ).toEqual(["LIVE_INTEGRATIONS"]);
  });

  it("reports a missing live integration grant", () => {
    expect(
      missingBlockFeatures([{ type: "DISCORD", enabled: true }], [
        { featureKey: "LIVE_INTEGRATIONS", enabled: false, limit: null },
      ]),
    ).toEqual(["LIVE_INTEGRATIONS"]);
  });
});
