import { describe, expect, it } from "vitest";

import {
  effectiveBlocks,
  effectiveTheme,
} from "~/server/publishing/effective-publication";
import { defaultThemeConfig } from "~/server/publishing/theme-v2";

describe("effective publication configuration", () => {
  it("preserves premium draft intent while safely degrading public output", () => {
    const premiumTheme = {
      ...defaultThemeConfig,
      background: {
        type: "VIDEO" as const,
        assetId: "cm12345678901234567890123",
        opacity: 80,
        overlay: { color: "#000000", opacity: 25, blur: 8, glass: 40 },
      },
      buttons: {
        ...defaultThemeConfig.buttons,
        style: "neon" as const,
        hoverEffect: "pulse" as const,
      },
      effects: { ...defaultThemeConfig.effects, layer: "digital-rain" as const },
      branding: { visible: false },
    };

    const output = effectiveTheme(premiumTheme, []);

    expect(output.background.type).toBe("SOLID");
    expect(output.effects.layer).toBe("none");
    expect(output.buttons.style).toBe("solid");
    expect(output.branding.visible).toBe(true);
    expect(premiumTheme.background.type).toBe("VIDEO");
  });

  it("removes live integrations only from effective public blocks", () => {
    const blocks = [
      { type: "LINK", enabled: true },
      { type: "GITHUB", enabled: true },
    ];
    expect(effectiveBlocks(blocks, [])).toEqual([
      { type: "LINK", enabled: true },
      { type: "GITHUB", enabled: false },
    ]);
    expect(blocks[1]?.enabled).toBe(true);
  });
});
