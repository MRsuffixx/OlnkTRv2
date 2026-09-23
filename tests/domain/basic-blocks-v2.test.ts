import { describe, expect, it } from "vitest";

import { parseBlockConfig } from "~/server/page/block-schemas";

describe("basic block v2 configuration", () => {
  it("normalizes legacy basic block configurations", () => {
    expect(
      parseBlockConfig("LINK", {
        title: "Portfolio",
        description: "Selected work",
        url: "https://example.com/work",
      }),
    ).toEqual({
      schemaVersion: 1,
      title: "Portfolio",
      description: "Selected work",
      url: "https://example.com/work",
      variant: "standard",
    });

    expect(parseBlockConfig("DIVIDER", {})).toEqual({
      schemaVersion: 1,
      style: "line",
      thickness: 1,
      width: 100,
    });

    expect(
      parseBlockConfig("IMAGE", {
        assetId: "cm12345678901234567890123",
        alt: "",
      }),
    ).toMatchObject({ schemaVersion: 1, decorative: true, alt: "" });

    expect(
      parseBlockConfig("SOCIALS", {
        items: [{ label: "GitHub", url: "https://github.com/octocat" }],
      }),
    ).toEqual({
      schemaVersion: 1,
      items: [
        {
          provider: "custom",
          label: "GitHub",
          url: "https://github.com/octocat",
        },
      ],
    });
  });

  it("accepts featured links and button presentation without arbitrary values", () => {
    expect(
      parseBlockConfig("FEATURED_LINK", {
        schemaVersion: 1,
        title: "Launch",
        description: "See the new release",
        url: "https://example.com/launch",
        icon: "star",
        assetId: "cm12345678901234567890123",
        presentation: "image",
      }),
    ).toMatchObject({
      schemaVersion: 1,
      icon: "star",
      presentation: "image",
    });

    expect(
      parseBlockConfig("BUTTON", {
        schemaVersion: 1,
        title: "Get started",
        url: "https://example.com/start",
        useGlobalStyle: false,
        style: "outline",
      }),
    ).toMatchObject({ useGlobalStyle: false, style: "outline" });

    expect(() =>
      parseBlockConfig("BUTTON", {
        schemaVersion: 1,
        title: "Unsafe",
        url: "javascript:alert(1)",
        useGlobalStyle: true,
      }),
    ).toThrow();

    expect(() =>
      parseBlockConfig("FEATURED_LINK", {
        schemaVersion: 1,
        title: "Unknown",
        url: "https://example.com",
        presentation: "image",
        arbitraryHtml: "<script>alert(1)</script>",
      }),
    ).toThrow();
  });

  it("bounds spacer size and enforces accessible image alternatives", () => {
    expect(
      parseBlockConfig("SPACER", {
        schemaVersion: 1,
        size: "custom",
        customPixels: 96,
      }),
    ).toEqual({ schemaVersion: 1, size: "custom", customPixels: 96 });

    expect(() =>
      parseBlockConfig("SPACER", {
        schemaVersion: 1,
        size: "custom",
        customPixels: 5000,
      }),
    ).toThrow();

    expect(() =>
      parseBlockConfig("IMAGE", {
        schemaVersion: 1,
        assetId: "cm12345678901234567890123",
        alt: "",
        decorative: false,
      }),
    ).toThrow();
  });

  it("requires an explicit creator attestation for adult destinations", () => {
    expect(
      parseBlockConfig("ADULT_LINK", {
        schemaVersion: 1,
        title: "Adults only",
        description: "External 18+ destination",
        url: "https://example.com/adult",
        icon: "external-link",
        platformLabel: "Creator page",
        attestedAdult: true,
      }),
    ).toEqual({
      schemaVersion: 1,
      title: "Adults only",
      description: "External 18+ destination",
      url: "https://example.com/adult",
      icon: "external-link",
      platformLabel: "Creator page",
      attestedAdult: true,
    });

    expect(() =>
      parseBlockConfig("ADULT_LINK", {
        schemaVersion: 1,
        title: "Missing attestation",
        url: "https://example.com/adult",
        attestedAdult: false,
      }),
    ).toThrow();

    expect(() =>
      parseBlockConfig("ADULT_LINK", {
        schemaVersion: 1,
        title: "Unsafe",
        url: "javascript:alert(1)",
        attestedAdult: true,
      }),
    ).toThrow();
  });
});
