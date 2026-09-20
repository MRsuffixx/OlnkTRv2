import {
  resolveEntitlement,
  type EntitlementGrant,
} from "~/server/entitlements/resolver";

export type PublishableBlock = { type: string; enabled: boolean };
export type BlockFeatureKey = "LIVE_INTEGRATIONS";

const liveBlockTypes = new Set([
  "DISCORD",
  "GITHUB",
  "SPOTIFY",
  "YOUTUBE",
  "TWITCH",
]);

export function requiredBlockFeatures(
  blocks: readonly PublishableBlock[],
): BlockFeatureKey[] {
  return blocks.some(
    (block) => block.enabled && liveBlockTypes.has(block.type),
  )
    ? ["LIVE_INTEGRATIONS"]
    : [];
}

export function missingBlockFeatures(
  blocks: readonly PublishableBlock[],
  grants: readonly EntitlementGrant[],
) {
  return requiredBlockFeatures(blocks).filter(
    (feature) => !resolveEntitlement(grants, feature, 0).allowed,
  );
}
