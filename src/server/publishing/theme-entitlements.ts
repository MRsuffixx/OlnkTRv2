import type { ThemeConfigV2 } from "./theme-v2";
import {
  resolveEntitlement,
  type EntitlementGrant,
} from "~/server/entitlements/resolver";

export type ThemeFeatureKey =
  | "BACKGROUND_VIDEO"
  | "PREMIUM_THEMES"
  | "CUSTOM_FONT"
  | "ADVANCED_ANIMATIONS"
  | "REMOVE_BRANDING";

const premiumFonts = new Set(["playfair-display", "jetbrains-mono"]);

export function requiredThemeFeatures(
  theme: ThemeConfigV2,
): ThemeFeatureKey[] {
  const features = new Set<ThemeFeatureKey>();

  if (theme.background.type === "VIDEO") features.add("BACKGROUND_VIDEO");
  if (
    theme.background.overlay.blur > 0 ||
    theme.background.overlay.glass > 0 ||
    theme.buttons.style === "glass" ||
    theme.buttons.style === "neon" ||
    theme.layout.profileLayout === "banner" ||
    theme.avatar.ring.style === "neon" ||
    theme.avatar.ring.colors.length > 2
  ) {
    features.add("PREMIUM_THEMES");
  }
  if (
    premiumFonts.has(theme.typography.heading.family) ||
    premiumFonts.has(theme.typography.body.family)
  ) {
    features.add("CUSTOM_FONT");
  }
  if (
    theme.effects.layer === "digital-rain" ||
    theme.effects.layer === "waves" ||
    (theme.background.type === "ANIMATED_GRADIENT" &&
      theme.background.motion === "waves") ||
    theme.buttons.hoverEffect === "pulse" ||
    theme.buttons.hoverEffect === "neon"
  ) {
    features.add("ADVANCED_ANIMATIONS");
  }
  if (!theme.branding.visible) features.add("REMOVE_BRANDING");

  return [...features];
}

export function missingThemeFeatures(
  theme: ThemeConfigV2,
  grants: readonly EntitlementGrant[],
) {
  return requiredThemeFeatures(theme).filter(
    (feature) => !resolveEntitlement(grants, feature, 0).allowed,
  );
}
