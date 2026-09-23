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
