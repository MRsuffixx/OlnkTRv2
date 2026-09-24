import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  BasicBlockPreview,
  spacerHeight,
} from "~/features/editor/preview/basic-block-preview";
import { patchBasicBlockConfig } from "~/features/editor/inspectors/basic-block-inspector";
import { defaultThemeConfig } from "~/server/publishing/theme-v2";

const labels = {
  adult: "18+",
  featured: "Featured",
  link: "Link",
  image: "Image",
};

describe("basic block editor UI", () => {
  it("renders prominent and adult previews without activating destinations", () => {
    const featured = renderToStaticMarkup(
      createElement(BasicBlockPreview, {
        type: "FEATURED_LINK",
        config: {
          title: "Launch",
          description: "See what is new",
          url: "https://example.com/launch",
          presentation: "spotlight",
        },
        theme: defaultThemeConfig,
        labels,
      }),
    );
    expect(featured).toContain("Launch");
    expect(featured).toContain("See what is new");
    expect(featured).toContain('data-block-preview="featured-link"');
    expect(featured).toContain('data-presentation="spotlight"');

    const imageFeatured = renderToStaticMarkup(
      createElement(BasicBlockPreview, {
        type: "FEATURED_LINK",
        config: {
          title: "Visual launch",
          url: "https://example.com/visual",
          presentation: "image",
          assetId: "cm12345678901234567890123",
        },
        theme: defaultThemeConfig,
        labels,
      }),
    );
    expect(imageFeatured).toContain('data-presentation="image"');
    expect(imageFeatured).toContain("/api/media/cm12345678901234567890123");

    const adult = renderToStaticMarkup(
      createElement(BasicBlockPreview, {
        type: "ADULT_LINK",
        config: {
          title: "Adults only",
          url: "https://example.com/adult",
          attestedAdult: true,
        },
        theme: defaultThemeConfig,
        labels,
      }),
    );
    expect(adult).toContain("Adults only");
    expect(adult).toContain("18+");
    expect(adult).not.toContain('href="https://example.com/adult"');
  });

  it("uses per-block Button styling in the live preview", () => {
    const button = renderToStaticMarkup(
      createElement(BasicBlockPreview, {
        type: "BUTTON",
        config: {
          title: "Quiet action",
          url: "https://example.com",
          useGlobalStyle: false,
          style: "minimal",
        },
        theme: defaultThemeConfig,
        labels,
      }),
    );
    expect(button).toContain("background:transparent");
    expect(button).toContain("color:var(--olnk-page-text)");
  });

  it("keeps spacer rendering bounded", () => {
    expect(spacerHeight({ size: "small" })).toBe(12);
    expect(spacerHeight({ size: "medium" })).toBe(28);
    expect(spacerHeight({ size: "large" })).toBe(56);
    expect(spacerHeight({ size: "custom", customPixels: 96 })).toBe(96);
    expect(spacerHeight({ size: "custom", customPixels: 5000 })).toBe(160);
  });

  it("merges inspector changes without dropping versioned configuration", () => {
    expect(
      patchBasicBlockConfig(
        {
          schemaVersion: 1,
          title: "Before",
          url: "https://example.com",
          attestedAdult: true,
        },
        { title: "After" },
      ),
    ).toEqual({
      schemaVersion: 1,
      title: "After",
      url: "https://example.com",
      attestedAdult: true,
    });
  });
});
