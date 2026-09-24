import type { CSSProperties } from "react";

export function basicSpacerHeight(config: Record<string, unknown>) {
  if (config.size === "small") return 12;
  if (config.size === "large") return 56;
  if (config.size === "custom") {
    const value =
      typeof config.customPixels === "number" ? config.customPixels : 28;
    return Math.min(160, Math.max(4, value));
  }
  return 28;
}

export function basicButtonStyleOverride(
  config: Record<string, unknown>,
): CSSProperties | undefined {
  if (config.useGlobalStyle !== false) return undefined;
  if (config.style === "outline") {
    return {
      background: "transparent",
      color: "var(--olnk-page-text)",
      border: "1px solid var(--olnk-page-border)",
    };
  }
  if (config.style === "soft") {
    return {
      background:
        "color-mix(in srgb, var(--olnk-page-button) 15%, transparent)",
      color: "var(--olnk-page-text)",
      border: "1px solid transparent",
    };
  }
  if (config.style === "minimal") {
    return {
      background: "transparent",
      color: "var(--olnk-page-text)",
      border: "1px solid transparent",
    };
  }
  return {
    background: "var(--olnk-page-button)",
    color: "var(--olnk-page-button-text)",
    border: "1px solid transparent",
  };
}

export function featuredPresentation(config: Record<string, unknown>) {
  return config.presentation === "compact" || config.presentation === "image"
    ? config.presentation
    : "spotlight";
}
