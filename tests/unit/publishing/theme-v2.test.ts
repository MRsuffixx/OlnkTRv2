import { describe, expect, it } from "vitest";

import {
  defaultThemeConfig,
  migrateThemeConfig,
  themeConfigV2Schema,
} from "~/server/publishing/theme-v2";
import {
  missingThemeFeatures,
  requiredThemeFeatures,
} from "~/server/publishing/theme-entitlements";

const v1Fixture = {
  schemaVersion: 1,
  colors: {
    background: "#102030",
    text: "#f5f7ff",
    accent: "#7868ff",
  },
  layout: {
    alignment: "left",
    maxWidth: 620,
    blockGap: 18,
    pagePadding: 30,
    avatarShape: "rounded",
  },
  background: {
    type: "GRADIENT",
    from: "#102030",
    to: "#302060",
    angle: 145,
  },
  typography: {
    family: "serif",
    scale: 110,
    weight: "semibold",
    lineHeight: 1.6,
  },
  buttons: {
    style: "outline",
    shape: "pill",
    height: 56,
    shadow: "strong",
  },
} as const;

describe("ThemeConfig v2", () => {
  it("migrates v1 without changing visible colors and layout", () => {
    const migrated = migrateThemeConfig(v1Fixture);

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.colors.background).toBe("#102030");
    expect(migrated.colors.text).toBe("#f5f7ff");
    expect(migrated.colors.mutedText).toBe("#f5f7ff");
    expect(migrated.background).toMatchObject({
      type: "GRADIENT",
      stops: ["#102030", "#302060"],
      angle: 145,
    });
    expect(migrated.layout.alignment).toBe("left");
    expect(migrated.avatar.shape).toBe("rounded");
    expect(migrated.typography.heading.family).toBe("lora");
    expect(migrated.typography.body.family).toBe("lora");
    expect(migrated.buttons.shape).toBe("pill");
  });

  it("rejects arbitrary remote fonts and asset URLs", () => {
    expect(() =>
      themeConfigV2Schema.parse({
        ...defaultThemeConfig,
        typography: {
          ...defaultThemeConfig.typography,
          heading: {
            ...defaultThemeConfig.typography.heading,
            family: "url(https://evil.test/font.woff2)",
          },
        },
      }),
    ).toThrow();
    expect(() =>
      themeConfigV2Schema.parse({
        ...defaultThemeConfig,
        background: {
          ...defaultThemeConfig.background,
          type: "IMAGE",
          assetId: "https://evil.test/background.jpg",
        },
      }),
    ).toThrow();
  });

  it("maps Premium-only visual intent to centralized feature keys", () => {
    const premiumTheme = themeConfigV2Schema.parse({
      ...defaultThemeConfig,
      background: {
        type: "VIDEO",
        assetId: "cm12345678901234567890123",
        opacity: 85,
        overlay: { color: "#000000", opacity: 25, blur: 8, glass: 35 },
      },
      buttons: {
        ...defaultThemeConfig.buttons,
        style: "neon",
        hoverEffect: "neon",
      },
      effects: {
        ...defaultThemeConfig.effects,
        layer: "digital-rain",
      },
      branding: { visible: false },
    });

    expect(requiredThemeFeatures(premiumTheme)).toEqual([
      "BACKGROUND_VIDEO",
      "PREMIUM_THEMES",
      "ADVANCED_ANIMATIONS",
      "REMOVE_BRANDING",
    ]);
    expect(
      missingThemeFeatures(premiumTheme, [
        { featureKey: "BACKGROUND_VIDEO", enabled: true, limit: null },
        { featureKey: "REMOVE_BRANDING", enabled: true, limit: null },
      ]),
    ).toEqual(["PREMIUM_THEMES", "ADVANCED_ANIMATIONS"]);
  });
});
