import {
  resolveEntitlement,
  type EntitlementGrant,
} from "~/server/entitlements/resolver";
import type { ThemeConfigV2 } from "./theme-v2";

function allowed(grants: readonly EntitlementGrant[], feature: string) {
  return resolveEntitlement(grants, feature, 0).allowed;
}

export function effectiveTheme(
  source: ThemeConfigV2,
  grants: readonly EntitlementGrant[],
): ThemeConfigV2 {
  const theme = structuredClone(source);

  if (!allowed(grants, "BACKGROUND_VIDEO") && theme.background.type === "VIDEO") {
    theme.background = {
      type: "SOLID",
      color: theme.colors.background,
      overlay: { color: "#000000", opacity: 0, blur: 0, glass: 0 },
    };
  }
  if (!allowed(grants, "PREMIUM_THEMES")) {
    theme.background.overlay.blur = 0;
    theme.background.overlay.glass = 0;
    if (theme.buttons.style === "glass" || theme.buttons.style === "neon") {
      theme.buttons.style = "solid";
    }
    if (theme.layout.profileLayout === "banner") {
      theme.layout.profileLayout = "centered";
    }
    if (theme.avatar.ring.style === "neon") {
      theme.avatar.ring.style = "solid";
    }
    theme.avatar.ring.colors = theme.avatar.ring.colors.slice(0, 2);
  }
  if (!allowed(grants, "CUSTOM_FONT")) {
    if (["playfair-display", "jetbrains-mono"].includes(theme.typography.heading.family)) {
      theme.typography.heading.family = "geist";
    }
    if (["playfair-display", "jetbrains-mono"].includes(theme.typography.body.family)) {
      theme.typography.body.family = "geist";
    }
  }
  if (!allowed(grants, "ADVANCED_ANIMATIONS")) {
    if (["digital-rain", "waves"].includes(theme.effects.layer)) {
      theme.effects.layer = "none";
    }
    if (
      theme.background.type === "ANIMATED_GRADIENT" &&
      theme.background.motion === "waves"
    ) {
      theme.background = {
        type: "GRADIENT",
        stops: theme.background.stops,
        angle: theme.background.angle,
        overlay: theme.background.overlay,
      };
    }
    if (["pulse", "neon"].includes(theme.buttons.hoverEffect)) {
      theme.buttons.hoverEffect = "none";
    }
  }
  if (!allowed(grants, "REMOVE_BRANDING")) {
    theme.branding.visible = true;
  }
  return theme;
}

export function effectiveBlocks<T extends { type: string; enabled: boolean }>(
  blocks: readonly T[],
  grants: readonly EntitlementGrant[],
): T[] {
  const liveAllowed = allowed(grants, "LIVE_INTEGRATIONS");
  const liveTypes = new Set([
    "DISCORD",
    "GITHUB",
    "SPOTIFY",
    "YOUTUBE",
    "TWITCH",
  ]);
  return blocks.map((block) => ({
    ...block,
    enabled: block.enabled && (liveAllowed || !liveTypes.has(block.type)),
  }));
}
