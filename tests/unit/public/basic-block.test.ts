import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PublicBasicBlock } from "~/features/public/basic-block";
import { defaultThemeConfig } from "~/server/publishing/theme-v2";

describe("public basic blocks", () => {
  it("renders an Adult Link as a labeled button without an eager destination", () => {
    const html = renderToStaticMarkup(
      createElement(PublicBasicBlock, {
        block: {
          id: "adult-block",
          type: "ADULT_LINK",
          config: {
            schemaVersion: 1,
            title: "Adults only",
            url: "https://example.com/adult",
            attestedAdult: true,
          },
        },
        profileId: "profile-a",
        theme: defaultThemeConfig,
      }),
    );

    expect(html).toContain("Adults only");
    expect(html).toContain("18+");
    expect(html).toContain('type="button"');
    expect(html).not.toContain('href="https://example.com/adult"');
  });

  it("renders featured, button, and bounded spacer variants", () => {
    const featured = renderToStaticMarkup(
      createElement(PublicBasicBlock, {
        block: {
          id: "featured",
          type: "FEATURED_LINK",
          config: {
            schemaVersion: 1,
            title: "Launch",
            url: "https://example.com/launch",
            presentation: "spotlight",
          },
        },
        profileId: "profile-a",
        theme: defaultThemeConfig,
      }),
    );
    expect(featured).toContain("Launch");
    expect(featured).toContain('href="https://example.com/launch"');

    const spacer = renderToStaticMarkup(
      createElement(PublicBasicBlock, {
        block: {
          id: "space",
          type: "SPACER",
          config: { schemaVersion: 1, size: "custom", customPixels: 200 },
        },
        profileId: "profile-a",
        theme: defaultThemeConfig,
      }),
    );
    expect(spacer).toContain("height:160px");
  });
});
