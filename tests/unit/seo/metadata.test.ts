import { describe, expect, it } from "vitest";

import {
  marketingMetadata,
  privateRouteMetadata,
} from "~/lib/seo-metadata";

describe("route metadata helpers", () => {
  it("creates canonical social metadata for a public marketing route", () => {
    expect(
      marketingMetadata({
        title: "Features",
        description: "Build a better creator page.",
        path: "/features",
        appUrl: "https://olnk.tr",
      }),
    ).toMatchObject({
      title: "Features",
      description: "Build a better creator page.",
      alternates: { canonical: "https://olnk.tr/features" },
      openGraph: {
        type: "website",
        url: "https://olnk.tr/features",
        title: "Features",
      },
      twitter: { card: "summary", title: "Features" },
    });
  });

  it("prevents private application routes from entering search results", () => {
    expect(privateRouteMetadata("Dashboard")).toMatchObject({
      title: "Dashboard",
      robots: { index: false, follow: false, noarchive: true },
    });
  });
});
